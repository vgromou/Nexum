# Contributing

## Dependency license policy

Nexum is distributed under the MIT License. To keep the project safe for
commercial redistribution without per-deployment license audits, **every new
runtime or test dependency must be licensed under MIT or another MIT-compatible
permissive license**:

- MIT
- Apache 2.0
- BSD-2-Clause / BSD-3-Clause
- ISC
- PostgreSQL License

### Not acceptable

- Commercial / paid licenses (e.g. FluentAssertions 8.x Xceed Community License)
- Split / dual licenses that require a paid tier for commercial use
  (e.g. SixLabors Split License for ImageSharp 3.x)
- Copyleft licenses that force the whole project to become GPL/AGPL when linked
  (LGPL dynamic linking is reviewed case-by-case)
- Anything with a "non-commercial" clause

### Before adding a dependency

1. Check the package's current license on its repository and on NuGet/npm
   (licenses can change between major versions — ImageSharp 2.x → 3.x is a
   well-known example).
2. If it is not on the permitted list above, open an issue and propose an
   MIT-compatible alternative before submitting a PR.
3. Add the package and its license to the matrix in [README.md](./README.md).

### Currently avoided

- `FluentAssertions` ≥ 8.0 — use `AwesomeAssertions` (Apache 2.0) instead.
- `SixLabors.ImageSharp` ≥ 3.0 — use `Magick.NET-Q8-AnyCPU` (Apache 2.0) or
  `SkiaSharp` (MIT) instead.
