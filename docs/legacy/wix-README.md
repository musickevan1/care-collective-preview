<br>
<p align="center">
  <img width="300" src="https://github.com/wix-incubator/wix-code-docs/assets/91874936/dfa0822f-c9cf-4523-90ca-37d1a4754975" alt="Wix IDE Logo">
</p>


<h3 align="center"> The Wix IDE is a VS Code-based IDE that allows you to edit your site's code in your browser. You can use the IDE to add backend and frontend code files to your site.</h3>
<br>
<p align="center">
  <img src="https://img.shields.io/badge/Velo-API%20Reference-116DFF?link=https%3A%2F%2Fwww.wix.com%2Fvelo%2Freference%2Fapi-overview" alt="Velo API Reference">
  <img src="https://img.shields.io/badge/Join%20our-Discord-asdsad?link=https%3A%2F%2Fdiscord.com%2Finvite%2FbRV9afmS4K" alt="Join our Discord">
  <img src="https://img.shields.io/badge/Follow%20us-on%20X%20(Formerly%20Twitter)-313131?link=https%3A%2F%2Ftwitter.com%2FDevsOnWix" alt="Follow us on Twitter">
</p>



---
<br>
<h2><img height="32" src="https://github.com/wix-incubator/wix-code-docs/assets/91874936/dcfed635-329d-4749-8698-e131f612ceb9">&nbsp;&nbsp;Contents</h2>

- [Getting started](#getting-started)
- [Adding frontend code to site pages](#frontend-code)
- [Writing backend code](#backend-code)
- [Writing public code](#public-code)
- [Customizing your site using CSS](#css-code)
- [Adding custom extensions](#spi-code)
- [Working in concurrent mode](#concurrent)
- [Using the Wix IDE for Blocks](#blocks)

<br>


<br>

<h2 id="getting-started"><img  height="32" src="https://github.com/wix-incubator/wix-code-docs/assets/91874936/b867a824-5250-4f5d-8883-e4f99c005db5">&nbsp;&nbsp;Getting started</h2>
<br>

<img width="280" height="280" src="https://github.com/wix-incubator/wix-code-docs/assets/91874936/08897a2d-eb67-4731-bb06-e018baeb2b6f"/><br><br>

Your site's file structure is located under the `src` folder which contains the following folders:

* [backend](/.wix/docs/README-backend.md)
* [pages](/.wix/docs/README-pages.md)
* [public](/.wix/docs/README-public.md)
* [styles](/.wix/docs/README-CSS.md)

<br>

<h2 id="frontend-code" ><img  height="32" src="https://github.com/wix-incubator/wix-code-docs/assets/91874936/129988de-e68b-432e-9337-eac1fb5410a1">&nbsp;&nbsp;Adding frontend code to site pages</h2>

<br>

The `src/pages` folder contains code files for each of the pages on your site as well as the [masterpage.js](https://support.wix.com/en/article/velo-working-with-the-velo-sidebar#global-site) file. New pages you add to your site from the editor appear under this folder. Use the [$w API](https://www.wix.com/velo/reference/$w) to interact with your site's elements: 

```javascript
$w.onReady(function () {
  
  $w("elementId").onClick(() => {
    console.log("Hello World!")
  })

});
```
The code you add to these files runs when visitors open pages on your site.

<h3 style="font-weight:bold">Page code files</h3>


When you add a page to your site in the Wix editor, a code file for that page gets added to the pages folder in your repo. The name of the file has 2 components: the name of the page that you define when you create it, and an ID string for internal use. The sections are separated by a period.

<br><img width="350" height="150" src="https://github.com/wix-incubator/wix-code-docs/assets/91874936/1b50ae83-1ff8-43a3-879c-2c5c0bab789c"/><br>


> **Notes:** 
> * Do not rename code files for pages. Wix uses these file names to associate the files with the appropriate pages on your site.
> * You can't create new page code files in the Wix IDE. To add a file, create a new page for your site in the editor. 

<h4 style="font-weight:bold">masterpage.js</h4>


The code in your `masterpage.js` runs on all pages of your site. This file is created automatically. Use this file to add code for elements that appear on all pages of your site or for general site functionality.


<h3 style="font-weight:bold">Importing code from other files</h3>


To import functions from other code files into your page code, using the syntax below. 

For public code files:

```javascript
import {functionName} from 'public/myFileName';
```

For backend code files:

```javascript
import {functionName} from 'backend/myFileName.web';
```
>**Note**: Trying to import code from the relative path in your site's files doesn't work.

<br>


<br>

<h2 id="backend-code"><img  height="32" src="https://github.com/wix-incubator/wix-code-docs/assets/91874936/d60d940c-dc1d-4cf6-8d1e-edfe3c4ef2da">&nbsp;&nbsp;Writing backend code</h2>

The `src/backend` folder contains the backend code files for your site. Backend code files for Wix sites are written in JavaScript and run using the Node.js runtime environment.
<br>

<h3 style="font-weight:bold">Web methods</h3>
In order to call backend code from the frontend, use a special type of wrapper function called a web method within a web module. A web module is represented by a file with a `.web.js` suffix. Wix handles all the backend-frontend communication required to enable this access.


<br><br>
Here is an example of a web method that multiplies two numbers:

```javascript
// math.web.js

export const multiply = webMethod(Permissions.Anyone, (a,b) => {
    return a * b
});
```

This function can be then called from the frontend like this:

```javascript
// Home.c1dmp.js

import { multiply } from 'backend/math.web.js';

$w.onReady(function () {
    multiply(3,4).then((results) => {
        console.log(results);
    })
});

```


<h3 style="font-weight:bold">Special backend files</h3>

Wix supports special backend files that provide  different functionality. Add the following files to the backend folder to include them in your site:
+ **Web Module files:**  
  These are files that allow you to expose functions in your site's backend that you can run in your frontend code. These files require a `.web.js` file extension. 

+ **data.js**  
  A file for [adding data hooks](https://support.wix.com/en/article/velo-using-data-hooks) to your site's collections.

+ **routers.js**  
  A file for implementing [routing and sitemap](https://support.wix.com/en/article/velo-about-routers#routing-code) functionality for your site.

+ **events.js**  
  A file for implementing your site's [backend event handlers](https://support.wix.com/en/article/velo-backend-events). 

+ **http-functions.js**  
  A file for implementing [HTTP endpoints](https://www.wix.com/velo/reference/wix-http-functions/introduction) that are exposed on your site.

+ **jobs.config**  
  A file for [scheduling recurring jobs](https://support.wix.com/en/article/velo-scheduling-recurring-jobs). Jobs consist of backend code that's run at regular intervals.
  
+ **General backend files**  
  JavaScript code files. You can import code from these files into any other backend file on your site. These files require a `.js` file extension.


<br>

<h2 id="css-code"><img  height="32" src="https://github.com/wix-incubator/wix-code-docs/assets/91874936/879fd884-50d9-49c0-8680-7e7065786a47">&nbsp;&nbsp;Customizing your site using CSS</h2>

The `src/styles/global.css` file contains the CSS code for your site. Styling with CSS allows you to completely customize the elements on your site.

There are 2 ways to apply CSS styling to your site:

<h3 style="font-weight:bold">1. Global classes</h3>

Use global classes to apply styling to all elements of a specific type, on all site pages. CSS editing is available for [these supported classes](https://www.wix.com/velo/reference/$w/styling-elements-with-css#$w_styling-elements-with-css_available-classes).

The example below show how to set a red background to all of your buttons in your site.

```css 
  .button {
    background-color: red;
  }
```
<h3 style="font-weight:bold">2. Custom classes</h3>

Use custom classes to apply style for specific elements. You can create custom classes using the CSS Classes panel, or with code using the [CustomClassList API](https://www.wix.com/velo/reference/$w/customclasslist).

The example below show how to change the cursor on a button to crosshair:
```css
  .myCustomClass {
    cursor: crosshair;
  }
```

<br>


<br>

<h2 id="spi-code"><img  height="32" src="https://github.com/wix-incubator/wix-code-docs/assets/91874936/2ba347da-57dd-4697-9206-4df4a5afb96e">&nbsp;&nbsp;Adding custom extensions</h2>

[Custom extensions](/.wix/docs/README-SPI.md), also known as SPIs, allow you to add your own custom logic to existing Wix app flows and to integrate services from 3rd party providers. The `src/backend/__spi__` folder contains a subfolder for each custom extension on your site.

The process for implementing an SPI has these steps: 
1. Create a new extension on your site using the Wix Studio Code panel. 
1. Implement your extension with custom code using the Wix IDE. 
1. Deploy the extension by publishing your site. 

Learn more about [custom app extensions using SPIs](https://support.wix.com/en/article/velo-custom-app-extensions-using-spis).

<br>


<br>

<h2 id="concurrent"><img  height="32" src="https://github.com/wix-incubator/wix-code-docs/assets/91874936/47071bd3-4294-4bb8-b487-c478067bff87">&nbsp;&nbsp;Working in concurrent mode (Beta)</h2>

Two or more site collaborators can edit a site's code at the same time in the Wix IDE. Edits made in one instance of the IDE are synced to the other instance in real time.

However, you can't edit your site's code in both the Wix IDE and the Wix Studio Code panel at the same time. You also can't edit your code in the Code panel if other site collaborators are editing in the Wix IDE. When you open the Wix IDE, the Code panel switches to read-only mode. The Code panel displays this message:

![Go to Wix IDE button](https://github.com/wix-incubator/wix-code-docs/assets/89579857/b0c53a04-962c-4a88-bf0c-18f521961e5e)

If you want to edit your site's code in the Code panel, all site collaborators must close the Wix IDE. You can then click **Start Coding** in the Code panel.

![Start Coding button](https://github.com/wix-incubator/wix-code-docs/assets/89579857/b5006237-9348-4f84-9597-3cfd82ae952e)

<br>

<blockquote class="tip">

__Tip:__
Don't forget to [publish your site](https://support.wix.com/en/article/wix-editor-saving-previewing-and-publishing-your-site#publishing-your-site) in the Wix editor to deploy your code.

</blockquote>


<br>

<h2 id="blocks"><img  height="32" src="https://static.wixstatic.com/media/9e7127_18ffe50831d7427b8eb0d6fb76e4ff05~mv2.png">&nbsp;&nbsp;Use the Wix IDE for Blocks</h2>

Wix IDE for Blocks provides the same functionality as available on websites, with a few modifications. 

<h3 style="font-weight:bold">Files and Folders overview</h3>

Below is a summary of your file and folder structure in Blocks. Note that the Wix IDE only displays code files for extensions created within Blocks, excluding self-hosted or CLI-based extensions.

* **Backend folder:** Contains your app's [backend code files](https://dev.wix.com/docs/develop-websites/articles/coding-with-velo/backend-code/web-modules/about-web-modules), which can include: 
    * General Javascript code files.
    * [Web modules](https://dev.wix.com/docs/develop-websites/articles/coding-with-velo/backend-code/web-modules/about-web-modules) with a `.web.js` file extension.
    * An `http-functions.js` file for implementing [HTTP functions](https://dev.wix.com/docs/build-apps/develop-your-app/frameworks/wix-blocks/code-in-blocks/expose-a-blocks-app-api-with-http-functions).
    * An `events.js` file for implementing your app's [backend event handlers](https://support.wix.com/en/article/velo-backend-events).
    * A `config.json` [Configuration file](https://dev.wix.com/docs/build-apps/develop-your-app/frameworks/wix-blocks/code-in-blocks/add-code-files-to-your-app#add-a-configuration-file) for defining specific settings for your app. You’ll see this file only if you added a Configuration file in Blocks.

* **Site folder:** Contains code files for each of the widgets or plugins in your app, including a **Panels** subfolder for their custom panels. Code files are created when the widgets, plugins or panels are added, and are deleted when they're removed. 

* **Public folder:** Contains your app's [public code files](https://dev.wix.com/docs/build-apps/develop-your-app/frameworks/wix-blocks/code-in-blocks/add-code-files-to-your-app). You can import code from these files into any other file in your app.

* **Dashboard folder:** Contains a file for each [dashboard page](https://dev.wix.com/docs/build-apps/develop-your-app/frameworks/wix-blocks/dashboard-pages/build-a-dashboard-page-in-blocks) in your app. Code files are created when the dashboard pages are created and deleted when they're removed.

* **README file:** A Markdown file to [document your app](https://dev.wix.com/docs/build-apps/develop-your-app/frameworks/wix-blocks/code-in-blocks/add-code-files-to-your-app#document-your-app). 

* **Other files:** The `jsconfig.json` file and `.wix` folder are in the repo's root folder.
They are used to support type checking and autocomplete in the IDE. Changes to these files aren't synced to your app and are lost when you close the IDE.


<h3 style="font-weight:bold">File naming</h3>

The name of the file for widgets, plugins, panels and dashboard pages has two parts, separated by a period. 
- The prefix is the name that you defined in Blocks.
- The suffix is an ID string for internal use.

For example:
- `Widget 1.odjx6.js`
- `New Panel 1.yjxgv.js`
  
>**Important:** Do not rename widget, plugin, panel, or dashboard code files. Wix uses these file names to associate files with their respective components. Renaming a file will result in your code being ignored, and a new file will be created.


<h3 style="font-weight:bold">Actions that can only be done in Blocks</h3>
Certain actions cannot be performed in the Wix IDE and must be done in Blocks:

- Adding NPM packages (once added, they can be imported in the IDE).
- Adding, changing, or deleting widgets, plugins, panels, and dashboard pages.
- Changing element IDs or default values.
- Adding [widget API properties](https://dev.wix.com/docs/build-apps/develop-your-app/frameworks/wix-blocks/widget-api/blocks-widget-properties).
- Previewing your app and [testing it in the Editor](https://dev.wix.com/docs/build-apps/develop-your-app/frameworks/wix-blocks/deploy-and-manage-blocks-apps/test-your-app-on-a-site).
- [Releasing a version](https://dev.wix.com/docs/build-apps/develop-your-app/frameworks/wix-blocks/deploy-and-manage-blocks-apps/manage-blocks-app-versions) of your app.
