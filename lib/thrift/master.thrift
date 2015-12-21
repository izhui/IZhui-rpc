service MasterService{
    string invoke(1:string method, 2:string request)
    string registe(1:string type,2:string serviceId,3:string request)
    string workerList()
    string readme(1:string serviceId)
}