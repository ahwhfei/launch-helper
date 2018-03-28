/* Module Parameter prototype */

function ModuleParameter(displayName, moduleClass, minVersion, maxVersion, moduleName, hostModuleName, moduleSize)
{
	this.ModuleClass = moduleClass;
	this.MinVersion = minVersion;
	this.MaxVersion = maxVersion;
	this.DisplayName = displayName;
	this.ModuleName = moduleName;
	this.HostModuleName = hostModuleName;
	this.ModuleDate = new Date();
	this.ModuleSize = moduleSize;
}
