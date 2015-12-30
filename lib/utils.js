Array.prototype.forEachExt = function( fn ){
    for(var i = 0;i<this.length;i++){
        var b = fn(this[i],i);
        if(b){
            return this[i];
        }
    }
}