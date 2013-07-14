var tools = require( "./tools.js" );
var path = require( "path" );
var marked = require( "marked" );
var hbs = require( "hbs" );
var fs = require( "fs" );
var async = require( "async" );

/**
* Serves favicon requests
*
* change to oResponse.sendfile( sFaviconPath ) as soon as available
*/
exports.sendFavicon = function( oRequest, oResponse, next )
{
	oResponse.send( 404, "Favicon not found" );
};

exports.setView = function( oRequest, oResponse, next )
{
	if( oRequest.params && oRequest.params.example )
	{
		oResponse.locals.view = "examples/" + oRequest.params.example + "/index";
	}
	else
	{
		oResponse.locals.view = "index";
	}

	next();
};

/**
* This method performs the following tasks
*
* - retrieve the list of folders within the examples directory
* - substract the directories that don't have a example.json file on the top level
* - Load and parse the example.json files
* - create a link to the example's index file based on the directory path
* - make all this information available as a view variable
*/
exports.getExampleList = function( oRequest, oResponse, next )
{
	var sExampleDir = path.join( SERVER_ROOT, CONF.exampleDir ),
		pExampleFilePaths = [];

	var fMapToExampleConfigPath = function( sFolderPath )
	{
		return path.join( sExampleDir, sFolderPath, CONF.exampleConfigFileName );
	};

	var fOnDirContent = function( oError, pPaths )
	{
		async.filter( pPaths.map( fMapToExampleConfigPath ), fs.exists, fLoadAllExtensionFiles );
	};

	var fOnFileLoad = function( sPath, fDone, oError, sContent )
	{
		fDone(oError, { content: sContent, path: sPath });
	};

	var fLoadExtensionFile = function( sPath, fDone )
	{
		fs.readFile( sPath, "utf8", fOnFileLoad.bind( this, sPath, fDone ) );
	};

	var fLoadAllExtensionFiles = function( pExtensionFilePaths )
	{
		async.map( pExtensionFilePaths, fLoadExtensionFile, fAddAsResponseParam );
	};

	var fAddAsResponseParam = function( oError, pExtensionFiles )
	{
		var mEntry;

		oResponse.locals.examples = [];

		for( var i = 0; i < pExtensionFiles.length; i++ )
		{
			mEntry = JSON.parse( pExtensionFiles[ i ].content );
			mEntry.link = path.dirname( tools.fileNameToUrl( pExtensionFiles[ i ].path ) ) + "/";

			oResponse.locals.examples.push( mEntry );
		}

		next();
	};

	fs.readdir( sExampleDir, fOnDirContent );
};

exports.getSourceFileList = function( oRequest, oResponse, next )
{
	var mTasks = {
		js: tools.readDirRecoursively.bind( tools, path.join( SERVER_ROOT, "fc/js" ) ),
		css: tools.readDirRecoursively.bind( tools, path.join( SERVER_ROOT, "fc/css" ) )
	};

	var fOnResult = function( oError, mResult )
	{
		oResponse.locals.ressources =
		{
			js: mResult.js[ 0 ].map( tools.fileNameToUrl ),
			css: mResult.css[0].map( tools.fileNameToUrl )
		};

		var sBootstrap = "/fc/js/bootstrap.js";

		oResponse.locals.ressources.js.splice( oResponse.locals.ressources.js.indexOf( sBootstrap ), 1 );
		oResponse.locals.ressources.js.unshift( sBootstrap );

		next();
	};

	async.parallel( mTasks, fOnResult );
};

exports.send = function( oRequest, oResponse )
{
	var fSend = function( oError, sHtml )
	{
		if( oError === null )
		{
			oResponse.send( sHtml );
		}
		else
		{
			oResponse.send( 404, oError.message );
		}
	};

	oResponse.render( oResponse.locals.view, fSend );
};