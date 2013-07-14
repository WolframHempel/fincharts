fc.namespace( "fc.processor" );

fc.processor.Processor = function()
{
	fc.tools.EventEmitter.call( this );

	this._pWorkers = [];
	this._mTaskCallbacks = {};
	this._nTaskId = 0;
	this._nDefaultJobCount = 0;

	if( typeof window.Worker === "function" && fc.defaults.useWorkerIfAvailable === true )
	{
		this._createWorker();
	}
	else
	{
		this._createSimulatedWorker();
	}
};

fc.processor.Processor.prototype.setSeries = function( sName, pValues, fCallback )
{
	this._sendToAllWorkers( "setSeries", { name: sName, values: pValues }, fCallback );
};

fc.processor.Processor.prototype.setParam = function( sName, vValue, fCallback )
{
	this._sendToAllWorkers( "setParam", { name: sName, value: vValue }, fCallback );
};

fc.processor.Processor.prototype.addJob = function( sName, fJob, fCallback )
{
	this._sendToAllWorkers( "addJob", { name: sName, job: fJob.toString() }, fCallback );
};


/**
*	[
*		{ name: "slice", config: { series: "a", from: 100, to: 300 } },
*		{ name: "sma", config:{ period: 5 } },
*		{ name: "toScreenCoords" }
*	]
*/
fc.processor.Processor.prototype.runJobs = function( pJobConfigs, fCallback )
{
	var oWorker = this._getIdleWorker();
	var nTaskId = this._getTaskId();

	oWorker.isReady = false;

	var mAction =
	{
		action: "runJobs",
		taskId: nTaskId,
		data: { pipeline: pJobConfigs }
	};

	this._registerTaskCallback( 1, nTaskId, fCallback );

	oWorker.postMessage( mAction );
};

/************************************************************************
* PRIVATE																*
************************************************************************/
fc.processor.Processor.prototype._registerTaskCallback = function( nInvocationCount, nTaskId, fCallback )
{
	if( fCallback )
	{
		this._mTaskCallbacks[ nTaskId ] = { count: nInvocationCount, callback: fCallback };
	}
};

fc.processor.Processor.prototype._sendToAllWorkers = function( sAction, mData, fCallback )
{
	var nTaskId = this._getTaskId();

	var mMessage =
	{
		action: sAction,
		taskId: nTaskId,
		data: mData
	};

	this._registerTaskCallback( this._pWorkers.length, nTaskId, fCallback );

	for( var i = 0; i < this._pWorkers.length; i++ )
	{
		this._pWorkers[ i ].postMessage( mMessage );
	}
};

fc.processor.Processor.prototype._getTaskId = function()
{
	this._nTaskId++;
	return this._nTaskId;
};

fc.processor.Processor.prototype._getIdleWorker = function()
{
	for( var i = 0; i < this._pWorkers.length; i++ )
	{
		if( this._pWorkers[ i ].isBusy === false )
		{
			return this._pWorkers[ i ];
		}
	}

	/**
	* All workers are busy at the moment, let's return a random one
	*/
	return this._pWorkers[ Math.floor( Math.random() * this._pWorkers.length ) ];
};

fc.processor.Processor.prototype._processWorkerMessage = function( mMessageEvent )
{
	console.log( mMessageEvent.data, this._mTaskCallbacks );
	var mTaskCallback = this._mTaskCallbacks[ mMessageEvent.data.taskId ];

	if( mTaskCallback )
	{
		if( mTaskCallback.count > 1 )
		{
			mTaskCallback.count--;
		}
		else
		{
			mTaskCallback.callback( mMessageEvent.data );
			delete this._mTaskCallbacks[ mMessageEvent.data.taskId ];
		}
	}
	/**
	* If an error occurs for an action without a callback, throw it so
	* it doesn't get lost
	*/
	else if( mMessageEvent.data.success !== true )
	{
		throw mMessageEvent.data;
	}
};

fc.processor.Processor.prototype._createWorker = function()
{
	var sWorkerCode = /\{([^]*?)\}$/g.exec( fc.processor.worker.Worker.toString() )[ 1 ];

	var sWorkerBlobUrl =  URL.createObjectURL( new Blob( [ sWorkerCode ] ) );

	var oWorker, nTaskId = this._getTaskId();

	for( var i = 0; i < fc.defaults.numberOfWorkers; i++ )
	{
		this._bindWorker( new Worker( sWorkerBlobUrl ), i, nTaskId );
	}
};

fc.processor.Processor.prototype._createSimulatedWorker = function()
{
	this._bindWorker( new fc.processor.worker.SimulatedWorker(), 0 );
};

fc.processor.Processor.prototype._bindWorker = function( oWorker, nIndex, nTaskId )
{
	oWorker.onmessage = this._processWorkerMessage.bind( this );

	oWorker.isReady = false;

	this._registerTaskCallback( 1, nTaskId, this._onWorkerReady.bind( this ) );

	this._pWorkers.push( oWorker );

	oWorker.postMessage( { action: "setIndex", data: nIndex, taskId: nTaskId } );
};

fc.processor.Processor.prototype._onWorkerReady = function( oResponse )
{
	this._pWorkers[ oResponse.index ].isReady = true;

	this._nDefaultJobCount = Object.keys( fc.processor.jobs ).length;

	for( var sJob in fc.processor.jobs )
	{
		this.addJob( sJob, fc.processor.jobs[ sJob ], this._onDefaultJobAdded.bind( this ) );
	}
};

fc.processor.Processor.prototype._onDefaultJobAdded = function( oResponse )
{
	this._nDefaultJobCount--;

	if( oResponse.success !== true )
	{
		throw oResponse;
	}

	if( this._nDefaultJobCount === 0 )
	{
		/**
		* Not elegant, but better than having to call Processor.init();
		*/
		setTimeout( this.emit.bind( this, "ready" ), 1);
	}
};