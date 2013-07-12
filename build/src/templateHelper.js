var fs = require( "fs" );
var path = require( "path" );
var hbs = require( 'hbs' );
var tools = require( './tools.js' );

/**
* Synchronously reads a file in the template folder
* and compiles it as a handlebar template using vData as context
*
* @param {STRING} sPath the path to the file, relative to CONF.templateFolder
* @param {MAP} vData the context for the template. OPTIONAL
*/
exports.template = function( sPath, vData )
{
	var sTemplatePath = path.join( SERVER_ROOT, CONF.templateFolder, sPath + ".html" );

	try
	{
		var sTemplate = fs.readFileSync( sTemplatePath, "utf8" );
	}
	catch( e )
	{
		if( e.code === "ENOENT" )
		{
			console.log( ( "Can't find template '" + sPath + "' in Folder " + path.join( CONF.templateFolder, sPath ) ).red );
		}
		else
		{
			throw e.toString();
		}
	}

	if( vData )
	{
		sTemplate = hbs.handlebars.compile( sTemplate )( vData );
	}

	return new hbs.handlebars.SafeString( sTemplate );
};

/**
* Encodes a string to be used in an URL
*
* @param {STRING} sInput The string to be encoded
*/
exports.toURL = function( sInput )
{
	return tools.niceUrlEncode( sInput );
};