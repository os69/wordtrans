# Firefox Translation Add-on 

## Functionality

WordTrans is a Firefox Add-on for translating individual words of a page by hovering with the mouse over the word.
* You can use multiple translation providers
* You can plug in a custom translation provider

## Installation
The Add-on hopefully soon is available via AMO distribution platform.

## Testing and Development

1. Install [jpm](https://developer.mozilla.org/en-US/Add-ons/SDK/Tools/jpm#Installation).
1. Clone the git repo
```
git clone https://github.com/os69/wordtrans.git
```
1. Test the Add-on by 
```
jpm run -b /usr/bin/firefox
```

## Using a Custom Translation Provider
Use the [provider](https://github.com/os69/wordtrans/blob/master/data/providers/custom.js) as a template. 
In the Add-on preferences maintian the URL to your custom translation provider. For local testing you can
use a file URL like:
```
file:///home/john/custom.js
```


