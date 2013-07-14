window.onload = function()
{
	var oProcessor = new fc.processor.Processor();

	oProcessor.setSeries( "open", AAPL_OHLC.open );


	var pJobConfig =
	[
		{ name: "slice", config: { series: "open", start: 500, to: 800 } }
	];

	oProcessor.on( "ready", function(){
		oProcessor.runJobs( pJobConfig, function( oResult ){
			console.log( "RAN SUCCESSFULLY", oResult );
		});
	});
};