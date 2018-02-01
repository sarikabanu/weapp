

function ProcessString() {
    this.GetTotalAmount = function (status) {
        var data = status.toLowerCase();
        var AllIndex = new Array();
        var AllTotal = new Array();
        for (var i = 0; i < data.length; i++) {
            i = data.indexOf("total", i) + 1;
            if (i == 0) {
                break;
            }
            AllIndex.push(i);
        }
        for (var i = 0; i < data.length; i++) {
            i = data.indexOf("amount", i) + 1;
            if (i == 0) {
                break;
            }
            AllIndex.push(i);
        }
        for (var i = 0; i < AllIndex.length; i++) {
            var index1 = AllIndex[i];
            var index2 = index1 + 15;
            var sub_string = data.substring(index1, index2).replace(/[^0-9.^0-9]/g, '').replace(/^\./, '').replace(/\.$/, '');
            var obj = new Object();
            obj.total = sub_string;
            AllTotal.push(obj);
        }
        var total_amt = '';
        for (var i = 0; i < AllTotal.length; i++) {
            if (AllTotal[i].total > total_amt) {
                total_amt = AllTotal[i].total;
            }
        }
        if (total_amt == '')
            return 0;
        else
            return total_amt;
    };

    this.GetSubTotalAmount = function (status) {
        var data = status.toLowerCase();
        var AllIndex = new Array();
        var AllTotal = new Array();
        for (var i = 0; i < data.length; i++) {
            i = data.indexOf("subtotal", i) + 1;
            if (i == 0) {
                break;
            }
            AllIndex.push(i);
        }
        for (var i = 0; i < AllIndex.length; i++) {
            var index1 = AllIndex[i];
            var index2 = index1 + 15;
            var sub_string = data.substring(index1, index2).replace(/[^0-9.^0-9]/g, '').replace(/^\./, '').replace(/\.$/, '');
            var obj = new Object();
            obj.total = sub_string;
            AllTotal.push(obj);
        }
        var total_amt = '';
        for (var i = 0; i < AllTotal.length; i++) {
            if (AllTotal[i].total > total_amt) {
                total_amt = AllTotal[i].total;
            }
        }
        if (total_amt == '')
            return 0;
        else
            return total_amt;
    };

    this.GetTax = function (status) {
        var data = status.toLowerCase();
        var AllIndex = new Array();
        var AllTotal = new Array();
        for (var i = 0; i < data.length; i++) {
            i = data.indexOf("tax", i) + 1;
            if (i == 0) {
                break;
            }
            AllIndex.push(i);
        }
        for (var i = 0; i < AllIndex.length; i++) {
            var index1 = AllIndex[i];
            var index2 = index1 + 15;
            var sub_string = data.substring(index1, index2).replace(/[^0-9.^0-9]/g, '').replace(/^\./, '').replace(/\.$/, '');
            var obj = new Object();
            obj.total = sub_string;
            AllTotal.push(obj);
        }
        var total_amt = '';
        for (var i = 0; i < AllTotal.length; i++) {
            if (AllTotal[i].total > total_amt) {
                total_amt = AllTotal[i].total;
            }
        }
        if (total_amt == '')
            return 0;
        else
            return total_amt;
    }

    this.GetItemsList = function (status) {
        var data = status.toLowerCase();
        var AllItems = new Array();
        var arr = data.split('\n');
        var flitered_arr = new Array();
        for (var i = 0; i < arr.length; i++) {
            var str1 = arr[i].replace(/[^0-9.^0-9]/g, '').replace(/^\./, '').replace(/\.$/, '');
            if (isFloat(str1)) {
                var arr1 = arr[i].split('\t');
                if (arr1.length == 2) {
                    var str1 = arr[i].split('\t')[0];
                    var str2 = arr[i].split('\t')[1].replace(/[^0-9.^0-9]/g, '').replace(/^\./, '').replace(/\.$/, '');
                    var obj = new Object();
                    if (isFloat(str2) & str1 != '' & str1 != 'total' &  str1.indexOf('.0') == -1 &  str1.indexOf('subtotal') == -1
                        & str1 != 'item'  & str1.indexOf('paid') == -1 & str1.indexOf(':') == -1
                        & str1.indexOf('express') == -1 & str1.indexOf('credit') == -1 & str1.indexOf('visa') == -1) {
                        obj.item_name = str1;
                        obj.item_price = parseFloat(str2);
                        flitered_arr.push(obj);
                    }
                }
                if (arr1.length > 2) {
                    var str1 = arr[i].split('\t')[arr1.length - 3] + arr[i].split('\t')[arr1.length - 2];
                    var str2 = arr[i].split('\t')[arr1.length - 1].replace(/[^0-9.^0-9]/g, '').replace(/^\./, '').replace(/\.$/, '');
                    var obj = new Object();
                    if (isFloat(str2) & str1 != '' & str1 != 'total' &  str1.indexOf('.0') == -1 &  str1.indexOf('subtotal') == -1
                        & str1 != 'item'  & str1.indexOf('paid') == -1 & str1.indexOf(':') == -1
                        & str1.indexOf('express') == -1 & str1.indexOf('credit') == -1 & str1.indexOf('visa') == -1) {
                        obj.item_name = str1;
                        obj.item_price = parseFloat(str2);
                        flitered_arr.push(obj);
                    }
                }
            }
        }
        return flitered_arr;
    };

    function isFloat(n) {
        var a = parseFloat(n);
        var rePattern = new RegExp(/[+-]?(?=\d*[.eE])(?=\.?\d)\d*\.?\d*(?:[eE][+-]?\d+)?/);
        // var patt='[+-]?(?=\d*[.eE])(?=\.?\d)\d*\.?\d*(?:[eE][+-]?\d+)?';
        // var status=patt.test(n);
        //if(a!=null && a!=undefined)
        // {
        //    return Number(a) === a && a % 1 !== 0;
        // }
        var arrMatches = n.match(rePattern);
        if(arrMatches!=null && arrMatches!=undefined) {
            if (arrMatches.length > 0) {

                return true;
            }
            else {
                return false;
            }
        }
        else
        {
            return null;
        }
    }
}

module.exports = new ProcessString();
