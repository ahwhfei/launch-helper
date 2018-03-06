function PointerGraphics(callback1) {
    var MONOCROME_FLAG = 0x01;
    var hotSpot = new Point(0, 0);
    var previoushotSpot, previousCursor;
    var pointerutil = new pointerUtil();
	var callback = callback1 ;
    this.CmdSetMousePointer = function cmdSetMousePointer(twTwoReadStream, memoryCache,  colorModel) {
        var dummy = twTwoReadStream.ReadUInt8();
        var isMonochrome = ((dummy & MONOCROME_FLAG) != 0);
        twTwoReadStream.ReadAbsoluteCoordinate(hotSpot);
        var imageRef = 0, paletteRef = 0, maskRef = 0;
        if (isMonochrome) {
            imageRef = twTwoReadStream.ReadUInt16();
            paletteRef = -1;
            maskRef = -1;
        }
        else {
            var control = twTwoReadStream.ReadUInt8();
            var hasPalette = (control & Bitmap.PALETTE_CTRL_FLAG) != 0;
            if (hasPalette) {
                dummy = twTwoReadStream.ReadUInt16();
                paletteRef = dummy;
            }
            else {
                paletteRef = -1;
            }

            imageRef = twTwoReadStream.ReadUInt16();
            maskRef = twTwoReadStream.ReadUInt16();
        }
        //if (PlatformInfo["isTouchOS"]) {
        //    return;
        //}
        //cursor will be in form of base64 what is return if it is not pressent then return null
        var cursor = null;
        var b = memoryCache.GetExpandedBitmap(imageRef);
        if (b) {
            cursor = b.Pixels;
        }
        else {
            var image = twTwoReadStream.ReadBitmap1(memoryCache, paletteRef, imageRef);
            var mask = null;
            if (maskRef < 0) {
                mask = null;
            }
            else {
                mask = twTwoReadStream.ReadBitmap1(memoryCache, -1, maskRef);
                if (image.Width != mask.Width || image.Height != mask.Height) {
                    throw cursorError.Image_Mask_Mismatch;
                }
                mask = mask.Pixels;
            }

            cursor = pointerutil.GetCursor(image.Pixels, mask, image.Width, image.Height, image.tp, colorModel, false);
            image.Pixels = cursor;
        }

        if (callback !== null) {
            callback.setDisplayCursor(cursor, hotSpot);
        }
        previousCursor = cursor;
        previoushotSpot = hotSpot;
    };

    this.CmdHideMousePointer = function cmdHideMousePointer( ) {
        // if (PlatformInfo["isTouchOS"]) {
            // return;
        // }
        var cursor = pointerutil.getHideCursor();

        if (cursor != null && callback !== null) {
            callback.setDisplayCursor(cursor, hotSpot);
        }
    };

    this.CmdRestoreMousePointer = function cmdRestoreMousePointer( ) {
        // if (PlatformInfo["isTouchOS"]) {
            // return;
        // }
        if (previousCursor != null && callback !== null) {
            callback.setDisplayCursor(previousCursor, previoushotSpot);
        }
    };
}
