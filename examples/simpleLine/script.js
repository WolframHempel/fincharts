window.onload = function()
{
	var oProcessor = new fc.processor.Processor();

	oProcessor.setSeries( "open", AAPL_OHLC.open );

	var fGetLength = function( mJobConfig, mInputData, fDone )
	{
		fDone( mSeries[ mJobConfig.series ].length );
	};

	var fOnReady = function()
	{
		var pJobConfig =
		[
			{ name: "getLength", config: { series: "open" } }
		];

		oProcessor.runJobs( pJobConfig, function( oResult ){
			console.log( "RAN SUCCESSFULLY", oResult );
		});
	};

	oProcessor.addJob( "getLength", fGetLength, fOnReady );
};