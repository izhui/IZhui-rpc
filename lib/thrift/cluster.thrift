service ClusterService{
    string registe(1:string id,2:string request)
    string unregiste(1:string id,2:string request)
    string process(1:string fromid,2:string toid,3:string request)
    string invoke(1:string toid, 2:string request)
}