fc.namespace( "fc.processor.worker" );

fc.processor.worker.SimulatedWorkerContext = function( oSimulatedWorker )
{
	this._oSimulatedWorker = oSimulatedWorker;
};

fc.processor.worker.SimulatedWorkerContext.prototype.postMessage = function( mMessage )
{
	this._oSimulatedWorker.onmessage({ data: mMessage });
};

fc.processor.worker.SimulatedWorkerContext.prototype.onmessage = function()
{
	//overwrite me
};