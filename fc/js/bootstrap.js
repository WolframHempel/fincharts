fc = {};

fc.namespace = function( sNamespace )
{
	var oRoot = window,
		pNamespace = sNamespace.split( "." );

	for( var i = 0; i < pNamespace.length; i++ )
	{
		if( !oRoot[ pNamespace[ i ] ] )
		{
			oRoot[ pNamespace[ i ] ] = {};
		}

		oRoot = oRoot[ pNamespace[ i ] ];
	}
};