# Security

For a possible vulnerability, use the repository's **Security → Report a vulnerability** feature if private vulnerability reporting has been enabled by the maintainer. If unavailable, open an issue asking for a private reporting channel without posting exploit details, private images, or credentials.

Include the affected version or commit, browser/OS, impact, and a minimal reproduction using a non-sensitive image. The project is maintained on a best-effort basis without a guaranteed response window. Until tagged releases exist, fixes target the current main branch.

This is a static browser application. It does not accept remote image URLs, execute SVG inputs, or expose an upload/API endpoint. File headers and dimensions are checked before decoding, but browser decoders and available device memory still affect behavior. Keep your browser updated.
