# Nexum

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A collaborative workspace platform built with ASP.NET Core 10 and React.

## Stack

- **Backend**: ASP.NET Core 10, Entity Framework Core, PostgreSQL
- **Frontend**: React 19, Vite, Storybook
- **Storage**: MinIO (S3-compatible)
- **Image processing**: Magick.NET

## Getting started

Start infrastructure services:

```bash
docker-compose up -d
```

Run the backend:

```bash
cd backend/Api
dotnet run
```

Run the frontend:

```bash
cd frontend
npm install
npm run dev
```

Swagger UI: http://localhost:5066/swagger

## License

Nexum is released under the [MIT License](./LICENSE).

## Third-party notices

Nexum depends on open-source components. All runtime and test dependencies are
distributed under MIT, Apache 2.0, BSD, ISC, or the PostgreSQL License — all of
which are compatible with MIT redistribution.

### Backend

| Package | License |
| --- | --- |
| AspNetCoreRateLimit | MIT |
| AwesomeAssertions | Apache 2.0 |
| BCrypt.Net-Next | MIT |
| coverlet.collector | MIT |
| EFCore.NamingConventions | Apache 2.0 |
| Magick.NET-Q8-AnyCPU | Apache 2.0 |
| Microsoft.AspNetCore.* | MIT |
| Microsoft.EntityFrameworkCore.* | MIT |
| Minio | Apache 2.0 |
| Moq | BSD-3-Clause |
| Npgsql.EntityFrameworkCore.PostgreSQL | PostgreSQL License |
| Swashbuckle.AspNetCore | MIT |
| xUnit | Apache 2.0 |

### Frontend

React, Vite, Storybook, lucide-react, axios, react-router-dom, dompurify,
@sentry/react SDK, ESLint, Prettier, Vitest, and @testing-library/*
are all distributed under MIT or ISC.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the dependency-license policy.
