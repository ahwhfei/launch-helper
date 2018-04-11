# Launch Helper of Receiver for HTML

## Background
The launch helper is a wrapper of Citrix HTML5 Receiver SDK. You can get official document from [Citrix Developer](https://developer-docs.citrix.com/projects/receiver-html5-sdk/en/latest/) site.
You will learn how to intergate SDK into your web app via reading Getting Started etc. The puropose of this launch helper is easy for usage. 

## Export functions
There are 2 functions exported. *launchHelper* and *getIca*.
*launchHelper* have 2 parameters: *handlers* and *config*.
*handlers* is an object of callback functions
```javascript
var handlers = {
    connectionHandler: function(event) {

    },
    connectionClosedHandler: function (event) {

    }
}
```
*config* is parameters of IcaJson API
```javascript 
var config = {
    src: "<API_OF_ICAJSON>"
    method: "<POST_or_GET>"
    api: "<SERVER_URL_OF_ICAJSON>"
}
```

* import 
```javascript
import * as launcher 'launch-helper';
launcher.launchHelper(handlers, config);
launcher.getIca(config);
```

* Add in *script*
```html
<script src="launch-helper.min.js"></script>
```

```javascript
var launcher = window['launch-helper'];
launcher.launchHelper(handlers, config);
launcher.getIca(config);
```

## How to use
Add a custom HTML tag like below

### Example 1 - Parameters in HTML
```html
<html>
    <head></head>
    <body>
        <launch-helper 
            src="/launch/IcaJson?locale=en-US"
            method="POST"
            api="https://poolmanagerdev.ctxwsdev.com/[customer]">
        </launch-helper>

        <script src="launch-helper.min.js"></script>
        <script>
            var launcher = window['launch-helper'];
            launcher.launchHelper();
        </script>
    </body>
</html>
```

### Example 2  - Parameters in JS
```html
<html>
    <head></head>
    <body>
        <launch-helper 
            src="/launch/IcaJson?locale=en-US"
            method="POST"
            api="https://poolmanagerdev.ctxwsdev.com/[customer]">
        </launch-helper>

        <script src="launch-helper.min.js"></script>
        <script>
            var launcher = window['launch-helper'];
            launcher.launchHelper(null, {
                src: "/launch/IcaJson?locale=en-US"
                method: "POST"
                api: "https://poolmanagerdev.ctxwsdev.com/[customer]"
            });
        </script>
    </body>
</html>
```

### Example 3 - With custom handlers
```html
<html>
    <head></head>
    <body>
        <launch-helper 
            src="/launch/IcaJson?locale=en-US"
            method="POST"
            api="https://poolmanagerdev.ctxwsdev.com/[customer]">
        </launch-helper>

        <script src="launch-helper.min.js"></script>
        <script>
            var launcher = window['launch-helper'];
            launcher.launchHelper({
                connectionHandler: function (event) {

                },
                connectionClosedHandler: function (event) {

                }
            }, {
                src: "/launch/IcaJson?locale=en-US"
                method: "POST"
                api: "https://poolmanagerdev.ctxwsdev.com/[customer]"
            });
        </script>
    </body>
</html>
```
