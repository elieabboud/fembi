using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PokeApi.Shared.Configurations;
using PokeApi.Shared.DTO;
using PokeApi.Shared.Interfaces;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;

namespace PokeApi.Shared.Services
{
    public class RabbitMQService : IRabbitMQService
    {
        private readonly RabbitMQOptions _options;
        private readonly ILogger<RabbitMQService> _logger;
        private readonly JsonSerializerOptions _jsonOptions;
        private readonly ConcurrentDictionary<string, TaskCompletionSource<string>> _pendingReplies;
        private readonly ConcurrentDictionary<string, EventingBasicConsumer> _consumers;

        private IConnection? _connection;
        private IModel? _channel;
        private readonly object _lock = new();
        private bool _disposed;

        public RabbitMQService(IOptions<RabbitMQOptions> options, ILogger<RabbitMQService> logger)
        {
            _options = options.Value;
            _logger = logger;
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = false
            };
            _pendingReplies = new ConcurrentDictionary<string, TaskCompletionSource<string>>();
            _consumers = new ConcurrentDictionary<string, EventingBasicConsumer>();

            InitializeConnection();
        }

        private void InitializeConnection()
        {
            try
            {
                var factory = new ConnectionFactory()
                {
                    HostName = _options.HostName,
                    Port = _options.Port,
                    UserName = _options.UserName,
                    Password = _options.Password,
                    VirtualHost = _options.VirtualHost,
                    RequestedConnectionTimeout = TimeSpan.FromSeconds(_options.ConnectionTimeoutSeconds),
                    RequestedHeartbeat = TimeSpan.FromSeconds(60),
                    AutomaticRecoveryEnabled = true,
                    NetworkRecoveryInterval = TimeSpan.FromSeconds(10)
                };

                _connection = factory.CreateConnection();
                _channel = _connection.CreateModel();

                _connection.ConnectionShutdown += OnConnectionShutdown;
                if (_connection is IAutorecoveringConnection autoRecoveringConnection)
                {
                    autoRecoveringConnection.RecoverySucceeded += OnRecoverySucceeded;
                }

                _logger.LogInformation("RabbitMQ connection established successfully");
                DeclareInfrastructure();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize RabbitMQ connection");
                throw;
            }
        }

        public void DeclareInfrastructure()
        {
            if (_channel == null) return;

            try
            {
                // Declare main exchange
                _channel.ExchangeDeclare(ExchangeNames.Pokemon, ExchangeType.Topic, durable: true);

                // Declare DLX
                _channel.ExchangeDeclare(ExchangeNames.PokemonDLX, ExchangeType.Topic, durable: true);

                // Declare queues with DLQ setup
                DeclareQueueWithDLQ(QueueNames.PokemonRequest, RoutingKeys.PokemonRequest);
                DeclareQueueWithDLQ(QueueNames.PokemonResponse, RoutingKeys.PokemonResponse);

                _logger.LogInformation("RabbitMQ infrastructure declared successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to declare RabbitMQ infrastructure");
                throw;
            }
        }

        private void DeclareQueueWithDLQ(string queueName, string routingKey)
        {
            if (_channel == null) return;

            var dlqName = $"{queueName}.dlq";
            var dlqRoutingKey = $"{routingKey}.dlq";

            // Declare DLQ
            _channel.QueueDeclare(dlqName, durable: true, exclusive: false, autoDelete: false);
            _channel.QueueBind(dlqName, ExchangeNames.PokemonDLX, dlqRoutingKey);

            // Declare main queue with DLX configuration
            var args = new Dictionary<string, object>
            {
                {"x-dead-letter-exchange", ExchangeNames.PokemonDLX},
                {"x-dead-letter-routing-key", dlqRoutingKey},
                {"x-message-ttl", 300000} // 5 minutes
            };

            _channel.QueueDeclare(queueName, durable: true, exclusive: false, autoDelete: false, args);
            _channel.QueueBind(queueName, ExchangeNames.Pokemon, routingKey);
        }

        public async Task<bool> PublishAsync<T>(string exchange, string routingKey, T message,
            string? correlationId = null, Dictionary<string, object>? headers = null,
            CancellationToken cancellationToken = default)
        {
            if (_channel == null)
            {
                _logger.LogError("RabbitMQ channel is not available");
                return false;
            }

            try
            {
                var envelope = new MessageEnvelope<T>
                {
                    CorrelationId = correlationId ?? Guid.NewGuid().ToString(),
                    Payload = message,
                    Headers = headers ?? new Dictionary<string, object>()
                };

                var body = JsonSerializer.SerializeToUtf8Bytes(envelope, _jsonOptions);

                var properties = _channel.CreateBasicProperties();
                properties.Persistent = true;
                properties.CorrelationId = envelope.CorrelationId;
                properties.MessageId = envelope.MessageId;
                properties.Timestamp = new AmqpTimestamp(DateTimeOffset.UtcNow.ToUnixTimeSeconds());
                properties.Headers = new Dictionary<string, object>(envelope.Headers);

                _channel.BasicPublish(exchange, routingKey, properties, body);

                _logger.LogDebug("Message published to exchange: {Exchange}, routing key: {RoutingKey}, correlation: {CorrelationId}",
                    exchange, routingKey, envelope.CorrelationId);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish message to exchange: {Exchange}, routing key: {RoutingKey}",
                    exchange, routingKey);
                return false;
            }
        }

        public async Task<TResponse?> PublishAndWaitForReplyAsync<TRequest, TResponse>(string exchange,
            string routingKey, TRequest request, string replyQueue, TimeSpan timeout,
            string? correlationId = null, CancellationToken cancellationToken = default)
        {
            correlationId ??= Guid.NewGuid().ToString();
            var tcs = new TaskCompletionSource<string>();

            _pendingReplies[correlationId] = tcs;

            try
            {
                // Set up reply consumer if not already done
                await EnsureReplyConsumer(replyQueue);

                // Publish request
                var published = await PublishAsync(exchange, routingKey, request, correlationId,
                    new Dictionary<string, object> { ["reply-to"] = replyQueue }, cancellationToken);

                if (!published)
                {
                    _pendingReplies.TryRemove(correlationId, out _);
                    return default;
                }

                // Wait for reply
                using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                timeoutCts.CancelAfter(timeout);

                try
                {
                    var replyJson = await tcs.Task.WaitAsync(timeoutCts.Token);
                    var envelope = JsonSerializer.Deserialize<MessageEnvelope<TResponse>>(replyJson, _jsonOptions);
                    return envelope.Payload;
                }
                catch (OperationCanceledException) when (timeoutCts.Token.IsCancellationRequested)
                {
                    _logger.LogWarning("Request timeout waiting for reply, correlation: {CorrelationId}", correlationId);
                    return default;
                }
            }
            finally
            {
                _pendingReplies.TryRemove(correlationId, out _);
            }
        }

        private async Task EnsureReplyConsumer(string replyQueue)
        {
            if (_consumers.ContainsKey(replyQueue) || _channel == null) return;

            _channel.QueueDeclare(replyQueue, durable: false, exclusive: true, autoDelete: true);

            var consumer = new EventingBasicConsumer(_channel);
            consumer.Received += (_, ea) =>
            {
                try
                {
                    var correlationId = ea.BasicProperties.CorrelationId;
                    if (!string.IsNullOrEmpty(correlationId) && _pendingReplies.TryRemove(correlationId, out var tcs))
                    {
                        var body = Encoding.UTF8.GetString(ea.Body.ToArray());
                        tcs.SetResult(body);
                    }

                    _channel.BasicAck(ea.DeliveryTag, false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing reply message");
                    _channel?.BasicNack(ea.DeliveryTag, false, false);
                }
            };

            _consumers[replyQueue] = consumer;
            _channel.BasicConsume(replyQueue, false, consumer);
        }

        public async Task StartConsumingAsync<T>(string queueName, Func<MessageEnvelope<T>, Task<bool>> messageHandler,
            CancellationToken cancellationToken = default)
        {
            if (_channel == null || _consumers.ContainsKey(queueName)) return;

            var consumer = new EventingBasicConsumer(_channel);
            consumer.Received += async (_, ea) =>
            {
                try
                {
                    var body = Encoding.UTF8.GetString(ea.Body.ToArray());
                    var envelope = JsonSerializer.Deserialize<MessageEnvelope<T>>(body, _jsonOptions);

                    if (envelope != null)
                    {
                        var success = await messageHandler(envelope);

                        if (success)
                        {
                            _channel.BasicAck(ea.DeliveryTag, false);
                        }
                        else
                        {
                            // Get retry count from headers
                            var retryCount = 0;
                            if (ea.BasicProperties.Headers != null &&
                                ea.BasicProperties.Headers.TryGetValue("x-retry-count", out var retryObj))
                            {
                                retryCount = Convert.ToInt32(retryObj);
                            }

                            retryCount++;

                            if (retryCount <= _options.RetryAttempts)
                            {
                                // Add retry count to headers and requeue
                                var newProps = _channel.CreateBasicProperties();
                                newProps.Headers = new Dictionary<string, object>(ea.BasicProperties.Headers ?? new Dictionary<string, object>())
                                {
                                    ["x-retry-count"] = retryCount
                                };

                                _channel.BasicNack(ea.DeliveryTag, false, true);
                            }
                            else
                            {
                                _channel.BasicNack(ea.DeliveryTag, false, false); // Send to DLQ
                            }
                        }
                    }
                    else
                    {
                        _channel.BasicNack(ea.DeliveryTag, false, false);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing message from queue: {QueueName}", queueName);
                    _channel?.BasicNack(ea.DeliveryTag, false, false);
                }
            };

            _consumers[queueName] = consumer;
            _channel.BasicConsume(queueName, false, consumer);

            _logger.LogInformation("Started consuming from queue: {QueueName}", queueName);
        }

        public async Task StopConsumingAsync(string queueName)
        {
            if (_consumers.TryRemove(queueName, out var consumer))
            {
                _logger.LogInformation("Stopped consuming from queue: {QueueName}", queueName);
            }
        }

        public async Task<bool> IsHealthyAsync()
        {
            try
            {
                return _connection?.IsOpen == true && _channel?.IsOpen == true;
            }
            catch
            {
                return false;
            }
        }

        private void OnConnectionShutdown(object? sender, ShutdownEventArgs e)
        {
            _logger.LogWarning("RabbitMQ connection shutdown: {Reason}", e.ReplyText);
        }

        private void OnRecoverySucceeded(object? sender, EventArgs e)
        {
            _logger.LogInformation("RabbitMQ connection recovery succeeded");
            DeclareInfrastructure();
        }

        public void Dispose()
        {
            if (_disposed) return;

            _channel?.Close();
            _channel?.Dispose();
            _connection?.Close();
            _connection?.Dispose();

            _disposed = true;
            _logger.LogInformation("RabbitMQ service disposed");
        }
    }
}