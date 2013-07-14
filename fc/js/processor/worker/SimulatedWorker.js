fc.namespace( "fc.processor.worker" );

fc.processor.worker.SimulatedWorker = function()
{
	this._oSimulatedWorkerContext = new fc.processor.worker.SimulatedWorkerContext( this );

	//this._oSimulatedWorkerContext.onmessage = this._proxyMessage.bind( this );

	/**
	* This is where the magic happens
	*/
	fc.processor.worker.Worker( this._oSimulatedWorkerContext );
};

fc.processor.worker.SimulatedWorker.prototype.postMessage = function( mMessage )
{
	this._oSimulatedWorkerContext.onmessage({ data: mMessage });
};

fc.processor.worker.SimulatedWorker.prototype.onmessage = function()
{
	//Overwrite me
};

fc.processor.worker.SimulatedWorker.prototype.terminate = function()
{
	//TODO
};

fc.processor.worker.SimulatedWorker.prototype._proxyMessage = function( mMessage )
{
	this.onmessage( mMessage );
};
