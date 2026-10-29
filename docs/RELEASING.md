# Publishing and release checklist

This checkout prepares version 0.1.0. It does not claim that remote repository settings, a hosted demo, a release tag, promotion, or conversion attribution have been configured.

## Repository metadata

The existing Git origin is `https://github.com/dgd000/cubist-image-tools.git`. In GitHub's About settings use:

| Setting                      | Value                                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| Description                  | Browser-based image utilities for resizing, cropping, and converting images. Built by CubistAI.      |
| Website before a demo exists | `https://cubistai.app/`                                                                              |
| Topics                       | `image-processing`, `image-resizer`, `image-converter`, `typescript`, `canvas`, `browser`, `privacy` |

Check the desired public visibility and enable Issues. Enable private vulnerability reporting under Security settings if available. Do not change visibility of another repository or publish the commercial source checkout.

## Validate the candidate

- [ ] Review `git diff` and untracked files. Exclude credentials, `.env*`, user images, logs, internal databases, and proprietary service code. Check any history being published; this repository starts independently of the commercial history.
- [ ] In an empty directory, install from the lockfile, build, and follow the README's development and production preview commands.
- [ ] Run `npm test`; install all three Playwright engines and run `npm run test:browsers` for the release candidate. Test a real local image on a physical touch device where available.
- [ ] Inspect PNG/JPEG/WebP downloads for dimensions, crop position, transparency, and JPEG background.
- [ ] Keep screenshots and browser verification records current. Use `CAPTURE_SCREENSHOTS=1 npm run test:browser` to regenerate desktop/mobile captures.
- [ ] Check the MIT and third-party notices, sample provenance, and README's support claims.

## Optional GitHub Pages demo

The Pages workflow is manual so a source push does not publish a demo automatically.

1. Push the reviewed source and lockfile to the intended repository.
2. In **Settings → Pages**, select **GitHub Actions** as the build/deployment source.
3. In Actions, run **Deploy demo to GitHub Pages** against the intended branch. The workflow tests core behavior and Chromium before deployment.
4. Wait for the workflow and deployment to succeed. Open the URL returned by GitHub, upload a local image, and verify a real download.
5. Set About → Website to that verified demo URL, and add the same URL near the top of the README. Keep the maintainer link to CubistAI.

The build uses relative asset paths for project subdirectories. No router fallback, server secrets, upload backend, or API is needed. See the official [Pages deployment action](https://github.com/actions/deploy-pages) and [artifact action](https://github.com/actions/upload-pages-artifact) for deployment requirements.

## Version 0.1.0

After candidate checks pass, replace “Unreleased” in CHANGELOG with the actual release date. Commit the final source, create an annotated `v0.1.0` tag, push the approved commit/tag, and create a GitHub release using the changelog and known limitations. Keep package.json and package-lock.json version fields aligned. npm publication is outside this project's scope; `private: true` prevents accidental publication of the application as a library.

## Attribution and sharing

The READMEs place a direct link to `https://cubistai.app/` immediately below the title. Their maintainer sections and the app footer also link to CubistAI using `utm_source=github`, `utm_medium=referral`, and `utm_campaign=cubist-image-tools`. The utility contains no tracking script. In CubistAI's existing analytics, verify that a clicked UTM link appears with those values; separately verify registration/payment attribution if those conversions are measured. The direct top links have no UTM parameters. Analytics must be checked in the commercial service and is not established by this repository's tests.

Publish the sample-based tutorial in `TUTORIAL.md` only where relevant and permitted. Do not mass-post promotional issues/comments or promise ranking improvements. After publication, record GitHub referral visits, relevant conversions, actual feedback, and independent citations for at least 30 days; longer if traffic is low. Stars alone do not establish product or SEO value.
