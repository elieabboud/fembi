using Microsoft.EntityFrameworkCore;
using PokeApi.Audit.Models;

namespace PokeApi.Audit.Data
{
    public class AuditDbContext : DbContext
    {
        public AuditDbContext(DbContextOptions<AuditDbContext> options) : base(options)
        {
        }

        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure AuditLog entity
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.ToTable("audit_logs");

                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id)
                    .HasColumnName("id")
                    .ValueGeneratedOnAdd();

                entity.Property(e => e.RequestId)
                    .HasColumnName("request_id")
                    .HasMaxLength(255)
                    .IsRequired();

                entity.Property(e => e.CorrelationId)
                    .HasColumnName("correlation_id")
                    .HasMaxLength(255)
                    .IsRequired();

                entity.Property(e => e.Source)
                    .HasColumnName("source")
                    .HasMaxLength(50)
                    .IsRequired();

                entity.Property(e => e.LimitValue)
                    .HasColumnName("limit_value")
                    .IsRequired();

                entity.Property(e => e.OffsetValue)
                    .HasColumnName("offset_value")
                    .IsRequired();

                entity.Property(e => e.Success)
                    .HasColumnName("success")
                    .IsRequired();

                entity.Property(e => e.ResponseDataJson)
                    .HasColumnName("response_data")
                    .HasColumnType("jsonb");

                entity.Property(e => e.ErrorMessage)
                    .HasColumnName("error_message");

                entity.Property(e => e.ProcessingTimeMs)
                    .HasColumnName("processing_time_ms");

                entity.Property(e => e.ExternalApiUrl)
                    .HasColumnName("external_api_url");

                entity.Property(e => e.CacheHit)
                    .HasColumnName("cache_hit")
                    .HasDefaultValue(false);

                entity.Property(e => e.CreatedAt)
                    .HasColumnName("created_at")
                    .HasDefaultValueSql("NOW()");

                entity.Property(e => e.UpdatedAt)
                    .HasColumnName("updated_at")
                    .HasDefaultValueSql("NOW()");

                // Indexes
                entity.HasIndex(e => e.RequestId).HasDatabaseName("idx_audit_logs_request_id");
                entity.HasIndex(e => e.CorrelationId).HasDatabaseName("idx_audit_logs_correlation_id");
                entity.HasIndex(e => e.Source).HasDatabaseName("idx_audit_logs_source");
                entity.HasIndex(e => e.CreatedAt).HasDatabaseName("idx_audit_logs_created_at");
                entity.HasIndex(e => e.Success).HasDatabaseName("idx_audit_logs_success");
                entity.HasIndex(e => new { e.Source, e.CreatedAt }).HasDatabaseName("idx_audit_logs_source_created_at");
                entity.HasIndex(e => new { e.Success, e.Source }).HasDatabaseName("idx_audit_logs_success_source");
            });
        }

        public override int SaveChanges()
        {
            UpdateTimestamps();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            UpdateTimestamps();
            return base.SaveChangesAsync(cancellationToken);
        }

        private void UpdateTimestamps()
        {
            var entries = ChangeTracker.Entries<AuditLog>();

            foreach (var entry in entries)
            {
                if (entry.State == EntityState.Modified)
                {
                    entry.Entity.UpdatedAt = DateTimeOffset.UtcNow;
                }
            }
        }
    }
}