# Christopher Khun — Portfolio

An ASP.NET Core 8 portfolio with static HTML, CSS, and JavaScript. The pixel night-sky design uses an original canvas landscape and a locally hosted font. No frontend packages or third-party requests are needed at runtime.

## Run locally

From the project folder:

~~~powershell
dotnet run --launch-profile http
~~~

Open http://localhost:5183. Local launch settings open the homepage.

## Edit the site

- `wwwroot/index.html`: animated introduction, selected projects, experience, and education.
- `wwwroot/work.html`: all four project panels with workflow illustrations.
- `wwwroot/about.html`: experience, education, and technical skills.
- `wwwroot/contact.html`: contact links and email.
- `wwwroot/transcriptive-ai.html`, `contact-search.html`, `simple-english.html`, and `object-oriented-game.html`: project details.
- `wwwroot/styles.css`: shared layouts, navigation, and page transitions.
- `wwwroot/pixel.css`: pixel typography, night/dawn colors, landscape layout, and opening text animation.
- `wwwroot/sky.js`: the original pixel landscape, opening sequence, cursor parallax, and ambient shooting stars.
- `wwwroot/site.js`: enhanced page navigation, history, theme switching, mobile menu, and clipboard interaction.
- `wwwroot/theme.js`: applies the saved appearance before the first paint.
- `wwwroot/assets/night-landscape.svg` and `dawn-landscape.svg`: static illustrations for visitors without JavaScript.
- `wwwroot/assets/fonts/`: locally hosted Pixelify Sans and its SIL Open Font License.
- `wwwroot/resume.pdf`: the supplied Christopher Khun resume.

Each page is complete HTML. Update shared navigation and footer markup consistently across all eight pages. Page descriptions and canonical URLs are in each page's head. Project diagrams are workflow illustrations, not screenshots of the applications.

Dark is the default. The header theme toggle changes the pages and landscape between night and dawn. The preference is stored locally as `portfolio-theme`; switching still works when storage is unavailable.

## Interaction and accessibility

The homepage presents a professional introduction with a brief scene and title animation once per browser-tab session. Visitors can skip it immediately. The decorative landscape includes subtle cursor parallax and ambient shooting stars; it has no game controls.

The low-resolution canvas draws at approximately 30 frames per second. Rendering stops when the scene is outside the viewport, the tab is hidden, or reduced motion is enabled. Page navigation disposes of its observers and event listeners.

Reduced-motion preferences skip the opening and stop ambient motion. Changes to this preference take effect during a visit. The intro skip action is keyboard accessible. The mobile menu supports Escape. Navigation uses the View Transitions API with a Web Animations fallback, moves focus to the main content, and preserves browser-history scroll position. Full-page navigation and the illustrated homepage also work without JavaScript.

The contact page opens the visitor's email app. Copy email is available when secure clipboard access is supported; no form backend is needed.

## Checks

Run the scene's behavior checks with Node.js (no dependencies):

~~~powershell
node tests/sky.test.cjs
~~~

These cover the opening, skip action, focus, reduced motion, browser storage failures, offscreen/background rendering, and cleanup during navigation.

Browser verification covers all eight pages at phone, tablet, and desktop widths, dark/light appearance, navigation, intro behavior, and local assets. The downloadable resume matches the supplied PDF byte-for-byte.

## Prepare a release

~~~powershell
dotnet publish Portfolio_Website.csproj -c Release -o "$env:USERPROFILE\Desktop\portfolio_publish"
~~~

Review the output before deploying. The existing desktop deployment note targets `C:\inetpub\portfolio`; confirm that this is still the IIS site's physical path before replacing live files. The approved redesign was published to https://chriskhun.com/ on October 8, 2026. The live domain was matched to this IIS folder before deployment. The update copied the 19 reviewed public files into the existing wwwroot folder; the running application and IIS configuration were preserved. All eight public pages were checked in the browser, and all 19 hosted files were verified over HTTPS against the release hashes.

The site assumes it is hosted at the root of chriskhun.com, matching the existing setup. Navigation and asset paths start with `/`.

## Artwork and font

The pixel scenery and project diagrams are original code-drawn artwork. Pixelify Sans is by Stefie Justprince and the Pixelify Sans Project Authors, distributed under the SIL Open Font License 1.1. Its license is included in `wwwroot/assets/fonts/OFL.txt`. Source: https://github.com/google/fonts/tree/main/ofl/pixelifysans.

The previous public website is backed up at C:\Users\asian\Desktop\WEBSITE\backups\portfolio-20261008-092159\wwwroot. Deployment and verification records are saved beside that backup.
