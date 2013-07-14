fc.namespace( "fc.processor.worker" );

fc.processor.worker.Worker = function( oSimulatedWorkerContext )
{
	var mParams = {},
		nIndex = null,
		mSeries = {},
		mJobs = {};

	/**
	* Not sure if this is the best way to determine whether we're
	* in a worker or not.
	*/
	if( self.document )
	{
		self = oSimulatedWorkerContext;
	}

	/**
	* The worker listens for incoming messages
	*/
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

	/**
	* This Response object is passed to any action the worker can execute.
	* the important bit is nTaskId here. This id is incremented by the processor
	* for every single call against any of the workers. The worker just keeps it and passes
	* it back. This allows the Processor to identify which task has finished and call
	* the right callback
	*
	* @param {STRING} sAction the action to be called ( must be in mActions )
	* @param {INT} nTaskId An id, used by the processor to map completed tasks to callbacks
	*/
	var Response = function( sAction, nTaskId )
	{
		/**
		* Every successful action uses this method confirm its execution
		* and optionally send data back to the processor.
		*
		* @param {VARIOUS} vResponseData Any serialisable object (no functions!)
		*/
		this.send = function( vResponseData )
		{
			var mData =
			{
				type: "confirmAction",
				data: vResponseData || null,
				index: nIndex,
				action: sAction,
				taskId: nTaskId,
				success: true
			};

			self.postMessage( mData );
		};

		/**
		* This method is used to notify the Processor when an
		* error occured within the worker
		*
		* @param {STRING} sErrorMessage
		*/
		this.sendFail = function( sErrorMessage )
		{
			var mData =
			{
				type: "actionFailed",
				reason: sErrorMessage,
				index: nIndex,
				action: sAction,
				taskId: nTaskId,
				success: false
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

		/**
		* Runs a pipeline (list) of Jobs in a serial, asynchronous
		* fashion
		*/
		runJobs: function( mData, oResponse )
		{
			var nCurrentJobIndex = 0;

			var fRunNext = function( vError, vOutput )
			{
				if( vError !== null )
				{
					oResponse.sendFail( 'Error while running job "' + mData.pipeline[ nCurrentJobIndex - 1 ].name + '": ' + vError.toString() );
					return;
				}

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