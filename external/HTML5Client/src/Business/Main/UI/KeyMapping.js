function IcaKey(sp, kc) 
{
    this.Special = sp;
    this.KeyChar = kc;
}

function KeyMapping() 
{

}

KeyMapping.KeyPress = "keypress";
KeyMapping.ScanCodeToKey1 = function(event, eventtype) 
{
    var key = event.keyCode;
    if (key == 0) // On Firefox event.keyCode is 0 for keyPress Event.
    {
        key = event.which;
    }
    var shiftKey = event.shiftKey;
    return KeyMapping.ScanCodeToKey(key, eventtype, shiftKey);
};

KeyMapping.enKbdLayoutList = [1033,4105,6153,2057]; // langID of en,en-ca,en-ie,en-gb

KeyMapping.kbdLayout = 1033; // default en-US

KeyMapping.ScanCodeToKey = function scanCodeToKey(keycode, eventtype, shiftKey) 
{
    var key = keycode;
    //todo
    if ((eventtype != KeyMapping.KeyPress) && (KeyMapping.Converter[key] != undefined)) 
    {
        return KeyMapping.Converter[key];
    }

    var icaKey = new IcaKey(false, ' ');
    icaKey.KeyChar = key;

    if (eventtype == KeyMapping.KeyPress) 
    {
        return icaKey;
    }

    if ((key >= 65 && key <= 90) || (key >= 97 && key <= 122)) 
    {
        if (shiftKey == false) {
            icaKey.KeyChar += 32;
        }
    } 
    else if (KeyMapping.symbolMap[key] !== undefined && KeyMapping.enKbdLayoutList.indexOf(KeyMapping.kbdLayout) !== -1) 
    {
        var symbol = KeyMapping.symbolMap[key];
        icaKey.KeyChar = symbol.charCodeAt(0);
    } 
    else 
    {
        icaKey.KeyChar = key;
    }
    return icaKey;
};


// character mapping of keycodes generated by chrome
KeyMapping.symbolMap = {};

if (g.environment.browser.isChrome) 
{
    KeyMapping.symbolMap[186] = ";";
    KeyMapping.symbolMap[187] = "=";
    KeyMapping.symbolMap[188] = ",";
    KeyMapping.symbolMap[189] = "-";
    KeyMapping.symbolMap[190] = ".";
    KeyMapping.symbolMap[191] = "/";
    KeyMapping.symbolMap[192] = "`";
    KeyMapping.symbolMap[219] = "[";
    KeyMapping.symbolMap[220] = "\\";
    KeyMapping.symbolMap[221] = "]";
    KeyMapping.symbolMap[222] = "\'";
}

	


KeyMapping.keyCodeToScanCode = {};
KeyMapping.keyCodeToScanCode[65] = 0x1E;	//a
KeyMapping.keyCodeToScanCode[67] = 0x2E;	//c
KeyMapping.keyCodeToScanCode[80] = 0x19;	//p
KeyMapping.keyCodeToScanCode[83] = 0x1F;	//s
KeyMapping.keyCodeToScanCode[86] = 0x2F;	//v
KeyMapping.keyCodeToScanCode[90] = 0x2C;	//z

KeyMapping.Converter = {};

KeyMapping.Converter[16] = new IcaKey(true, 5); // Left Shift
KeyMapping.Converter[17] = new IcaKey(true, 4); // Left Ctrl
KeyMapping.Converter[18] = new IcaKey(true, 8); // Left Alt




KeyMapping.Converter[32] = new IcaKey(true, 9);  //SPACE
KeyMapping.Converter[13] = new IcaKey(true, 3); //Enter
KeyMapping.Converter[8] = new IcaKey(true, 1);    //Backspace
KeyMapping.Converter[9] = new IcaKey(true, 2); //TAB

KeyMapping.Converter[33] = new IcaKey(true, 56); //Page up
KeyMapping.Converter[34] = new IcaKey(true, 59); //page Down
KeyMapping.Converter[35] = new IcaKey(true, 58); //End
KeyMapping.Converter[36] = new IcaKey(true, 55); //Home
KeyMapping.Converter[45] = new IcaKey(true, 54); //Insert
KeyMapping.Converter[46] = new IcaKey(true, 57); //Delete
KeyMapping.Converter[19] = new IcaKey(true, 67); //Pause/Break
KeyMapping.Converter[27] = new IcaKey(true, 0); //escape


//Arrow keys

KeyMapping.Converter[37] = new IcaKey(true, 61); //Left Arrow
KeyMapping.Converter[38] = new IcaKey(true, 60); //Up Arrow
KeyMapping.Converter[39] = new IcaKey(true, 63); //Right Arrow
KeyMapping.Converter[40] = new IcaKey(true, 62); //Down Arrow




//Function Keys
KeyMapping.Converter[112] = new IcaKey(true, 11); //F1
KeyMapping.Converter[113] = new IcaKey(true, 12); //F2
KeyMapping.Converter[114] = new IcaKey(true, 13); //F3
KeyMapping.Converter[115] = new IcaKey(true, 14); //F4
KeyMapping.Converter[116] = new IcaKey(true, 15); //F5
KeyMapping.Converter[117] = new IcaKey(true, 16); //F6
KeyMapping.Converter[118] = new IcaKey(true, 17); //F7
KeyMapping.Converter[119] = new IcaKey(true, 18); //F8
KeyMapping.Converter[120] = new IcaKey(true, 19); //F9
KeyMapping.Converter[121] = new IcaKey(true, 20); //F10
KeyMapping.Converter[122] = new IcaKey(true, 35); //F11
KeyMapping.Converter[123] = new IcaKey(true, 36); //F12


//Num Pad TODO-- not working currently ,need to check win32 code for type
KeyMapping.Converter[96] = new IcaKey(true, 31); // NUMPAD 0
KeyMapping.Converter[97] = new IcaKey(true, 28); // NUMPAD 1
KeyMapping.Converter[98] = new IcaKey(true, 29); // NUMPAD 2
KeyMapping.Converter[99] = new IcaKey(true, 30); // NUMPAD 3
KeyMapping.Converter[100] = new IcaKey(true, 25);// NUMPAD 4
KeyMapping.Converter[101] = new IcaKey(true, 26);// NUMPAD 5
KeyMapping.Converter[102] = new IcaKey(true, 27);// NUMPAD 6
KeyMapping.Converter[103] = new IcaKey(true, 22);// NUMPAD 7
KeyMapping.Converter[104] = new IcaKey(true, 23);// NUMPAD 8
KeyMapping.Converter[105] = new IcaKey(true, 24);// NUMPAD 9
KeyMapping.Converter[106] = new IcaKey(true, 7);// NUMPAD Multiply
KeyMapping.Converter[107] = new IcaKey(true, 33);// NUMPAD Add
KeyMapping.Converter[109] = new IcaKey(true, 32);// NUMPAD Substract
KeyMapping.Converter[110] = new IcaKey(true, 34);// NUMPAD Decimal point
KeyMapping.Converter[111] = new IcaKey(true, 52);// NUMPAD Divide

KeyMapping.Converter[91] = new IcaKey(true, 64); // Left Window key & search key in Chrome OS
KeyMapping.Converter[92] = new IcaKey(true, 65); //Right Window Key
KeyMapping.Converter[44] = new IcaKey(true, 68); //Print Screen Key
KeyMapping.Converter[93] = new IcaKey(true, 66); //Application Key



