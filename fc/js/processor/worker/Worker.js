fc.namespace( "fc.processor.worker" );

fc.processor.worker.Worker = function()
{
	var mParams = {},
		nIndex = null,
		mSeries = {},
		mJobs = {};


	self.onmessage = function( e )
	{
		var oResponse = new Response( e.data.action, e.data.taskId );

		if( mActions[ e.data.action ] )
		{
			mActions[ e.data.action ]( e.data.data, oResponse );
		}
		else
		{
			oResponse.sendFail( 'Unknown action "' + e.data.action + '"' );
		}
	};

	var Response = function( sAction, nTaskId )
	{
		this.send = function( mResponseData )
		{
			var mData =
			{
				type: "confirmAction",
				data: mResponseData || null,
				index: nIndex,
				action: sAction,
				taskId: nTaskId
			};

			self.postMessage( mData );
		};

		this.sendFail = function( sErrorMessage )
		{
			var mData =
			{
				type: "actionFailed",
				reason: sErrorMessage,
				index: nIndex,
				action: sAction,
				taskId: nTaskId
			};

			self.postMessage( mData );
		};
	};

	var mActions =
	{
		setIndex: function( nNewIndex, oResponse )
		{
			nIndex = nNewIndex;
			oResponse.send();
		},

		setSeries: function( mData, oResponse )
		{
			mSeries[ mData.name ] = mData.values;
			oResponse.send();
		},

		setParam: function( mData, oResponse )
		{
			mParams[ mData.name ] = mData.value;
			oResponse.send();
		},

		addJob: function( mData, oResponse )
		{
			try
			{
				eval( 'mJobs["' + mData.name + '"] = ' + mData.job );
				oResponse.send();
			}
			catch( e )
			{
				oResponse.sendFail( 'Error while adding job "' + mData.name +'": ' + e.toString() );
			}
		},

		runJobs: function( mData, oResponse )
		{
			var nCurrentJobIndex = 0;

			var fRunNext = function( vOutput )
			{
				var fJob, mJobConfig;

				if( mData.pipeline.length > nCurrentJobIndex )
				{
					fJob = mJobs[ mData.pipeline[ nCurrentJobIndex ].name ];

					if( !fJob )
					{
						oResponse.sendFail( 'Unknown job "' + mData.pipeline[ nCurrentJobIndex ].name + '"' );
						return;
					}

					mJobConfig = mData.pipeline[ nCurrentJobIndex ].config || null;

					nCurrentJobIndex++;

					fJob( mJobConfig, vOutput || null, fRunNext );
				}
				else
				{
					oResponse.send( vOutput );
				}
			};

			fRunNext( null );
		}
	};
};