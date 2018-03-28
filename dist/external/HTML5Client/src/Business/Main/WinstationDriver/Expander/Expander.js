function Expander()
{    
    var gExpander = new NullExpander(); 
    var dataConsumer = null;
    var bPaused = false;
		
	// These are tied to the ICA 3.0 protocol - DO NOT CHANGE!
	var V4_EXPANSION    = 4;
	var V3_EXPANSION    = 3;
	var NULL_EXPANSION  = 0;

    /**
     *  Switch on expansion, if relevant.
     */
    // Added :  Which level of expansion
    this.ActivateExpander = function(pow2, max, level)
	{
        if (pow2 > 0  ||  level == V3_EXPANSION || level == V4_EXPANSION)
		{
            //
            // Create an Expander depending on type
            //

            switch(level) {
	            case V4_EXPANSION:
	            case V3_EXPANSION:
	                if (!(gExpander instanceof V3Expander)) {
						gExpander = new V3Expander();
					}
	                break;
	
	            case NULL_EXPANSION:
	                if (!(gExpander instanceof NullExpander)) {
						gExpander = new NullExpander();
					}
	                break;
	                
				default:
	                throw ExpanderError.UNSUPPORTED_EXPENSION_TYPE;
	                break;
            }

            gExpander.init(pow2, max);
            unPause();
        }
   };

    this.disableExpander = function()
	{
        gExpander = new NullExpander();
   };

    this.pause = function()
	{
        bPaused = true;
   };

    var unPause = function()
	{
        bPaused = false;
   };

    /**********************************************************************
     *                                                                    *
     *  DataConsumer Interface Implementation                             *
     *                                                                    *
     **********************************************************************/

    /**
     * This is the callback used to process recieved data.
     * @param Data byte array to receive
     * @exception Exception If an error occurrs
     */
     //TODO throws
    this.consumeData = function(data, off, len)
	{
        if (bPaused)
		{
            dataConsumer.consumeData(data, off, len);
        }
		else
		{
            // Is this necessary?
            var exp = gExpander; // Reduce outer scope de-referencing.

            exp.expand(data, off, len);
            var arrBuffer = exp.outputBuffer();
            var offset = exp.outputOffset();
            var length = exp.outputLength();
			
			dataConsumer.consumeData(arrBuffer, offset, length);
        }
   };

    this.endConsuming = function(level, reason)
	{
        dataConsumer.endConsuming(level, reason);
   };
    
    this.setDataConsumer = function(consumer)
	{
        dataConsumer = consumer;
   };
}