# Use the official .NET 9 runtime as base image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 5002

# Use the official .NET 9 SDK for building
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY ["PokeApi.Audit/PokeApi.Audit.csproj", "PokeApi.Audit/"]
COPY ["PokeApi.Shared/PokeApi.Shared.csproj", "PokeApi.Shared/"]

RUN dotnet restore "PokeApi.Audit/PokeApi.Audit.csproj"

# Copy source code and build
COPY . .
WORKDIR "/src/PokeApi.Audit"
RUN dotnet build "PokeApi.Audit.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "PokeApi.Audit.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage/image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create a non-root user for security
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5002/health || exit 1

ENTRYPOINT ["dotnet", "PokeApi.Audit.dll"]