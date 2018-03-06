function ClipFormatConverter() {
};

ClipFormatConverter.convertData = function(data, sourceType, destinationType) {	
	// unicode -> text , remove NULL terminator
	if (destinationType == ClipFormatConverter.FORMAT_STRING && sourceType == ClipFormatConverter.FORMAT_WINDOWS_UNICODE_TEXT) {
		var text = Convert.ToUTF16LEFromByteArray(data, data.length);
		if (text.length > 1 && text[text.length-1] == "\0") {
			text = text.substr(0, text.length-1);
		}
		return text;
	}
	
	// text -> unicode, add NULL terminator
	if (destinationType == ClipFormatConverter.FORMAT_WINDOWS_UNICODE_TEXT && sourceType == ClipFormatConverter.FORMAT_STRING) {
		var bytes = Convert.ToByteArrayFromUTF16LE(data, new Uint8Array(data.length * 2 + 2), 0, (data.length * 2));
		return bytes;
	} 
	
	// html -> text
	if (destinationType == ClipFormatConverter.FORMAT_STRING && sourceType == ClipFormatConverter.FORMAT_NAME_HTML) {
		// make html tags to html format and then convert everything to utf8.
		return ClipFormatConverter.convertHtmltoStr(data);
	}
	
	// text -> html
	if (destinationType == ClipFormatConverter.FORMAT_NAME_HTML && sourceType == ClipFormatConverter.FORMAT_STRING) {
		// read utf8 html data and then parse html from it.
		return ClipFormatConverter.sanitizeHtml(Convert.ToUTF8FromByteArray(data, 0, data.length));
	}

	return "";
};


/*
 * it change local system clip board string by replacing
 * /r to /r/n
 * /r/rn remain unchanged
 */
ClipFormatConverter.replaceslashRtoslashRN = function(str) {
// On Windows leave string as-is Except for FIREFOX
	if (PlatformInfo["OS"] == OSInfo["WINDOWS"] && PlatformInfo["browserid"] != BrowserInfo["FIREFOX"]) {
		return str;
	} 	
	
	var CRLF = "\r\n";
	var out_str = "";
	var prevchar = "";
	var current_char;
	var len = str.length;
	for (var i = 0; i < len; i++) {
		current_char = str.charAt(i);
		if (current_char == '\n' && (i <= 0 || prevchar != '\r'))
			out_str += CRLF;
		else
			out_str += current_char;
		prevchar = current_char;
	}
	if (out_str == "")
		unsupported = true;
	out_str += "\0";
	return out_str;
};

//replace \r\n to \n
ClipFormatConverter.replaceslashRNtoslashN = function(str) {
	// On Windows leave string as-is
	if (PlatformInfo["OS"] == OSInfo["WINDOWS"]) {
		return str;
	}

	var buf = "";
	var len = str.length;
	var prevchar = "", currentchar;
	//replace \r\n to \n
	for (var i = 0; i < len; i++) {
		currentchar = str.charAt(i);
		if ((prevchar == "\r" ) && (currentchar == "\n" )) {
			buf += currentchar;
			prevchar = "";
		} else {
			buf += prevchar;
			prevchar = currentchar;
		}
	}
	buf += prevchar;
	return buf;
};

// Helper functions to support HTML format: https://msdn.microsoft.com/en-us/library/windows/desktop/ms649015(v=vs.85).aspx
// We do the following to make html more sane across browsers and apps:
// 1) Get data from <html...> to </html> case-insensitive. This way all the extra data put by HTML format which is not required can be ignored. If data doesn't contain <html> or fragment tags add it.
// 2) Office apps sometimes put extra characters after </html> so even those can be ignored now.
// 3) We should ideally read data between <!--StartFragment--> and <!--EndFragment--> but office apps keep style information outside of those so we read full html data.
// 4) When we call setData by including <html> and <!--StartFragment-->, chrome wraps entire data inside another html and fragment! So we remove outer layer as well.
// 5) Finally IE keeps entire page including script tags inside clipboard. We remove scripts on best effort basis from data as they have nothing to do with formatting and insecure.
ClipFormatConverter.sanitizeHtml = function(htmlData) {
	// First get data from between outermost html tags.
	var start = htmlData.search(/<html/i), tag, end;
    // Add <html> tag if it is not present. Only Windows OS puts full htmlformat in clipboard.
    if (start == -1) {
        htmlData = "<html><body><!--StartFragment-->" + htmlData +
                   "<!--EndFragment--></body></html>";
        start = 0;
        end = htmlData.length;
    } else {
	   tag = htmlData.substr(start+1, 4); // get html tag name as it could be case-insensitive.
	   end = htmlData.lastIndexOf("</" + tag + ">") + 7;
    }
	
	// Extract data between <!--StartFragment--> and <!--EndFragment--> only when there is an extra layer.
	tag = "<!--StartFragment-->";
	var startF = htmlData.indexOf(tag, start);
	if (startF != htmlData.lastIndexOf(tag, end)) {
		start = startF + tag.length;
		end = htmlData.lastIndexOf("<!--EndFragment-->", end);
	}
	htmlData = htmlData.substr(start, end-start);
	
	// Remove script tags using regex! We are not HTML editor so trying to keep things manageable
	htmlData = htmlData.replace(/<script[\s\S]*?<\/script>/gi, "");
	
	return htmlData;
};

ClipFormatConverter.convertHtmltoStr = function (html) {
	function formatNum(num) {
		var s = num+"";
		while (s.length < 10) s = "0" + s;
		return s;
	}
    
	// HTML Format is something like
	// "Version:0.9\n" +
	// "StartHTML:xxxxxxxxxx\n" +
	// "EndHTML:xxxxxxxxxx\n" +
	// "StartFragment:xxxxxxxxxx\n" +
	// "EndFragment:xxxxxxxxxx\n";
	
	var htmlUtf8Array = Convert.CharToByteUTF8(html,0);
    var startHtml = 100;
	var startFrag = startHtml + html.indexOf("<!--StartFragment-->") + 20;
	var endHtml = startHtml + htmlUtf8Array.length;
	var endFrag = html.indexOf("<!--EndFragment-->"); 
	var diffLength = html.length-endFrag;
	endFrag = startHtml + htmlUtf8Array.length - diffLength;
	var prefix = "Version:0.9" + "\n" +
			   "StartHTML:" + formatNum(startHtml) + "\n" +
			   "EndHTML:" + formatNum(endHtml) + "\n" +
			   "StartFragment:" + formatNum(startFrag) + "\n" +
			   "EndFragment:" + formatNum(endFrag) + "\n";   
    var prefixbytes = Convert.CharToByteUTF8(prefix, 0);
	var finalHTMLString = new Uint8Array(prefixbytes.length + htmlUtf8Array.length);
	finalHTMLString.set(prefixbytes, 0);
	finalHTMLString.set(htmlUtf8Array, prefixbytes.length);
    return finalHTMLString;
};


// Define ICA-supported clipboard formats
ClipFormatConverter.FORMAT_STRING = -1;
ClipFormatConverter.FORMAT_UNDEFINED = 0;
// Error case
ClipFormatConverter.FORMAT_WINDOWS_TEXT = 1;
ClipFormatConverter.FORMAT_WINDOWS_BITMAP = 2;
ClipFormatConverter.FORMAT_WINDOWS_METAFILE_PICTURE = 3;
ClipFormatConverter.FORMAT_WINDOWS_OEM_TEXT = 7;
ClipFormatConverter.FORMAT_WINDOWS_DIB = 8;
// "Device Independent Bitmap"
ClipFormatConverter.FORMAT_WINDOWS_PALETTE = 9;
ClipFormatConverter.FORMAT_WINDOWS_UNICODE_TEXT = 13;

ClipFormatConverter.FORMAT_PRIVATE = 0xFFFF;

// Registered formats
ClipFormatConverter.FORMAT_NAME_HTML = "HTML Format\0";
