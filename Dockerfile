# Stage 1: Build the application
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /source

# Copy everything
COPY . .

# Restore and Publish the API project
# Note: We specifically target the API project inside src/API
RUN dotnet restore "src/API/API.csproj"
RUN dotnet publish "src/API/API.csproj" -c Release -o /app/publish

# Stage 2: Run the application
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .

# Railway automatically assigns a PORT, we tell .NET to listen on 0.0.0.0
ENV ASPNETCORE_URLS=http://0.0.0.0:${PORT}

ENTRYPOINT ["dotnet", "API.dll"]