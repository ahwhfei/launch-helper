// Text metrics class used to measure width of text at given font size

function TextMetrics()

{

	// Create invisible div container to add text to for estimating text length

	var expandDiv = document.createElement('div');

	expandDiv.style.position = 'absolute';

	expandDiv.style.visibility = 'hidden';

	expandDiv.style.whiteSpace = 'nowrap';

	expandDiv.style.left = '-1000px';

	expandDiv.style.top = '-1000px';

	expandDiv.style.width = 'auto';

	expandDiv.style.height = 'auto';

	expandDiv.style.zIndex = '-1';

	document.getElementById("citrixHTML5root").appendChild(expandDiv);

	

	this.Length = function length(text, fontSize) {

		expandDiv.style.fontSize = fontSize + 'px';

		expandDiv.innerHTML = text;

		return expandDiv.clientWidth;

	};

}

