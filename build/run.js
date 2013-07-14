var express = require( 'express' );
var app = express();
var colors = require( 'colors' );
var tasks = require( "./src/tasks.js" );
var hbs = require( 'hbs' );
var path = require( 'path' );
var templateHelper = require( './src/templateHelper.js' );

/**
* The root directory. All paths in the config
* are relative to this
*/
SERVER_ROOT = path.join( __dirname, ".." );

/**
* Global CONF object
*/
CONF = require( './config.js' ).CONFIG;

/**
* Register all handlebar template helper
*/
for( var sTemplateName in templateHelper )
{
	hbs.registerHelper( sTemplateName, templateHelper[ sTemplateName ] );
}

/**
* We'll use plain HTML for the views. All
* markdown will be parsed and passed on as html
*/
app.set( 'view engine', 'html' );

/**
* Using Handlebars templating
*/
app.engine( 'html', hbs.__express );

/**
* Top level views are html templates
* in the pages folder
*/
app.set( "views", SERVER_ROOT );

/**
* Route requests to / to index
*/
app.get( "/", tasks.setView, tasks.getExampleList, tasks.send );

/**
* Route requests to /docs, /examples etc.
*/
app.get( "/examples/:example", tasks.setView, tasks.getExampleList, tasks.getSourceFileList, tasks.send );

/**
* Everything directory is browsable by default
*/
app.use( "/examples", express.directory( path.join( SERVER_ROOT, CONF.exampleDir ) ) );

/**
* Serve everything within the root folder as
* a static file unless specified otherwise by a preceding rule
*/
app.use( "/" + CONF.exampleDir, express.static( path.join( SERVER_ROOT, CONF.exampleDir ) ) );

/**
* Serve the source directory
*/
app.use( "/" + CONF.srcDir, express.static( path.join( SERVER_ROOT, CONF.srcDir ) ) );

/**
* Send out favicons - yehaa
*/
app.get( "/favicon.ico", tasks.sendFavicon );


var fOnReady = function()
{
	/**
	* and that's it...
	*/
	console.log( ( "Server running. Access the page at localhost:" + CONF.port ).green );
};

/**
* Start the app on port 3000
*/
app.listen( CONF.port, fOnReady );



