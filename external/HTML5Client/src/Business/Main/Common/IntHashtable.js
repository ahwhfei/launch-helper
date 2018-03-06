var MAX_NO_OF_ELEMENT_IN_HASH = 10 ;
/**
 * This class encapsulates a Integer Hashtable, using a native *int* for indexing.
 */
function IntHashtable () 
{
	var table      =  new Array() ;
	var noOfelements = 0;
  
	this.clear = function() 
	{
        table = {};
		noOfelements = 0;
    };
    
	this.get = function (key) 
	{
      if (table[key] !== undefined) 
	  {
        return table[key];
      } else 
	  {
        return null;
      }
   };

    this.put = function (key, elem) 
	{
        var prev = table[key];
        table[key] = elem;
        if (prev === undefined) 
		{
		   noOfelements++ ;
          return null;
        }
        return prev;
   };
}


/*
 *  This table is implemented as generic hash it is simply now array in  future it can be implemented as linklist
 * here argument is how many maximum entry in hash table 
 * 
 * put function :
 * 
 *wa can pass :1- key that is directly numeric then this key is actual storing key
 *  2:object if it is object then it should contain put function so that key can be calculated by that function 
 * default key for object is not handling properly in case of object
 * 
 * same case is with put function
 * 
 * null or undefined handling has not been done
 * 
 */
function genericHashTable( max_no )
{
	var max_element = MAX_NO_OF_ELEMENT_IN_HASH ;
	if( max_no )
	 max_element = max_no ;
	var valuetable =  new Array( 0 );
	var keytable =  new Array( 0 );
	var keysofkey = new Int32Array(0);
	var endkeys = 0;
	var myself = this;
	this.elements =  function( )
	{
		var element  = new Array(0); 
		var start = 0;
		for( var i = 0 ; i < endkeys ; i++)
	  {
	  	var temp = keysofkey[i] ;
	  	if( valuetable[temp] != null )
	  	  element[start++] = valuetable[temp] ;
	    
	  }
	  return element ;
	};
	this.clear = function ( )
	{
	for( var i = 0 ; i < endkeys ; i++)
	  {
	  	var temp = keysofkey[i] ;
	  	valuetable[temp] = null;
	    keytable[temp]     =  null ;
	  }
	  endkeys = 0;
	};
	var hashcode = null ;
	var equal = null ;
	myself.clear();
	this.put =  function ( key , element )
	{   
		//if( !( key && element ) )
		//  return ;
		 var key1 = key ;
		
		 hashcode = null ;
		 if( key.hashCode )
		    key1 =  key.hashCode( key ) ;
		key1 = key1 % max_element ;
		if( !keytable[key1] )
		 {
		 	keysofkey[endkeys++] = key1 ;
		 	
		 }
		valuetable[key1] = element ;
		keytable[key1] = key ;  
		
		
	};
	this.get =  function ( key )
	{
		//if( !key)
		 //return ;
		var key1 = myself.containsKey( key )
		var retvalue = null ;
		if( key1 )
		{
			 retvalue = valuetable[key1] ;
		 
			if( retvalue.get )
			   retvalue = retvalue.get( );
			
		}
		 
		return retvalue ;
	};
	this.remove = function( key )
	{
		var key1 = myself.containsKey( key )
		var retvalue = false ;
		if( key1 )
		{
			retvalue = true ;
			valuetable[key1] = null  ;
		    keytable[key1]   =  null ;
			
		}
		 
		return retvalue ;
	};
	this.containsKey = function( key )
	{
		var key1 = key ;
		 hashcode = null ;
		 equal = null ;
		 var retvalue = null ;
		 var temp = false ;
		 var tmpKey ;
		 if( key.hashCode )
		    key1 =  key.hashCode( key ) ;
		key1 = key1 % max_element ;
		if( keytable[key1] != null )
		{
			tmpKey = keytable[key1] ;
			
			temp = true ;
			if( tmpKey.equal )
			 {
			 	
			   temp =	tmpKey.equal( tmpKey , key );
			  
			 	
			 }
			 
			  
		}
		if( temp )
		 temp = key1 ;
		return temp ;
	};
	
	
}