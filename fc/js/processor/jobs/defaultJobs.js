fc.namespace( "fc.processor.jobs" );


fc.processor.jobs.slice = function( mConfig, vInput, fDone )
{
	var pSource;

	if( mConfig.series )
	{
		pSource = mSeries[ mConfig.series ];
	}
	else if( typeof vInput.length === "number" )
	{
		pSource = vInput;
	}
	else
	{
		fDone( "No input data available" );
		return;
	}

	fDone( null, pSource.slice( mConfig.start, mConfig.to || pSource.length ) );
};