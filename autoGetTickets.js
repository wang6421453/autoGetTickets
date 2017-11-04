/**
*author:wl
*date:2016-12-4
*超算自动接单插件
*/

function getXMLHttpRequest() {  
    var xhr;  
    if(window.ActiveXObject) {  
        xhr= new ActiveXObject("Microsoft.XMLHTTP");  
    }else if (window.XMLHttpRequest) {  
        xhr= new XMLHttpRequest();  
    }else {  
        xhr= null;  
    }  
    return xhr;  
}

//解析日期（//日期数据格式："/Date(1399392000000)/"）
function getDate(d){
    if(typeof(d) == "string"){
	   if(d.indexOf("/Date(") == 0){
	       var s = d.substring(6, d.length - 2);
		   d = new Date(parseInt(s, 10));
	   }else{
	       try{d = new Date(d)}
		   catch(e){return d;}
	   }
	}
	return d;
} 

//抢回
function grabTicket(id, groupId){
    var postData  = {"ticketId": id, "groupId": groupId};
	var xhr = getXMLHttpRequest();
	xhr.open("post","https://cc.nsccsz.gov.cn/ajaxnet/TicketDA.ashx");  
	xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	xhr.setRequestHeader("X-AjaxNet-Method", "GrabTicket");
	xhr.send(JSON.stringify(postData));
    xhr.onreadystatechange= function() {  
        if(xhr.readyState == 4 && xhr.status == 200) {
            console.log("成功抢回工单：" + id);
		}		
    };
}

//转发服务台并顺速抢回
function sendToServiceAndGrabBack(id, groupId){
    var postData  = {"ticketId": id, "groupId": 1, "comment":""};
	var xhr = getXMLHttpRequest();
	xhr.open("post","https://cc.nsccsz.gov.cn/ajaxnet/TicketDA.ashx");  
	xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	xhr.setRequestHeader("X-AjaxNet-Method", "TransferTicket");
	xhr.send(JSON.stringify(postData));
    xhr.onreadystatechange= function() {  
        if(xhr.readyState == 4 && xhr.status == 200) {
		    console.log("成功发送工单：" + id + "到服务台。");
            grabTicket(id, groupId);
		}		
    };
}

//直接接单
function claimTicket(ticketId){
    var postData  = {"ticketId": ticketId};
	var xhr = getXMLHttpRequest();
	xhr.open("post","https://cc.nsccsz.gov.cn/ajaxnet/TicketDA.ashx");  
	xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	xhr.setRequestHeader("X-AjaxNet-Method", "ClaimTicket");
	xhr.send(JSON.stringify(postData));
    xhr.onreadystatechange= function() {  
        if(xhr.readyState == 4 && xhr.status == 200) {
		    console.log("成功接单：" + ticketId);
		}		
    };
}

//修改难易程度
function editTicketDifficulty(ticketId){
    var postData  = {"ticketId": ticketId, "difficultyId": 2, "comment": "复杂"};
	var xhr = getXMLHttpRequest();
	xhr.open("post","https://cc.nsccsz.gov.cn/ajaxnet/TicketDA.ashx");  
	xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	xhr.setRequestHeader("X-AjaxNet-Method", "EditTicketDifficulty");
	xhr.send(JSON.stringify(postData));
    xhr.onreadystatechange= function() {  
        if(xhr.readyState == 4 && xhr.status == 200) {
		    console.log("成功将工单：" + ticketId + "修改为复杂。");
		}		
    };
}

//检查工单剩余时间是否小于规定时间，如果是则自动接单
var checkTickets = function(){
    $("#gridview-1054-body tr td:nth-child(1)").each(function(){
	   if($(this).text() != "" && $(this).text().indexOf("#") == 0){
	       //var id = $(this).siblings().eq(0).text().substring(1);
		   var id = $(this).text().substring(1);
	       console.log("检查工单:" + id);
		   var postData  = {"id": id, "detail": true};
           //$.post("https://cc.nsccsz.gov.cn/ajaxnet/TicketDA.ashx", JSON.stringify(postData),function(data){console.log(data);}); 
		   var xhr = getXMLHttpRequest();
		   xhr.open("post","https://cc.nsccsz.gov.cn/ajaxnet/TicketDA.ashx");  
		   xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		   xhr.setRequestHeader("X-AjaxNet-Method", "GetOneTicket");
		   xhr.send(JSON.stringify(postData));
           xhr.onreadystatechange= function() {  
                   if(xhr.readyState == 4 && xhr.status == 200) {
				        var values = JSON.parse(xhr.responseText).value;
                        var flows = values.Flows;	 
                        var length = flows.length;
						var lastFlow = flows[length - 1];
						
						//判断是否已经接单
						//获取当前负责人ID(0：代表还没人接)
						var currentOwnerUserId = values.CurrentOwnerUserId;
						//获取当前groupId(委业务系统是：8，服务台是：1, 没接是：0)
						var currentOwnerGroupId = values.CurrentOwnerGroupId;
						if(currentOwnerUserId == 0 && currentOwnerGroupId != 1){
						    console.log("发现未接工单：" + id + "，启动接单程序。");
						    claimTicket(id);
						}else{
						   //如果已经接的，开始计算时间
						   var endTime = lastFlow.EndTimeout;
						   endTime = getDate(endTime);
						   var now = new Date();
						   var leftMinutes = Math.floor((endTime - now)/(1000 * 60));
						   if(leftMinutes < 30){
						       console.log("工单:" + id + "剩余处理时间小于30分钟，开始启动处理程序。。。"); 
							  
							   //获取难易程度
							   var difficultyId = values.DifficultyId;
							   if(difficultyId == 1){
							       editTicketDifficulty(id);
							   }else if(difficultyId == 2){
							       sendToServiceAndGrabBack(id, currentOwnerGroupId);
							   }
						       
						    }
						}
						
                   }  
           };
	   }
	});
	
}

//刷新工单
var freshTickets= function(){
   /*$.get("http://cc.nsccsz.gov.cn/ajaxnet/ext4/TicketDA.ashx?v=Main&_dc=1480569456505&status=2&type=0&person=60&datestart=2016%2F12%2F01&dateend=2016%2F12%2F01&page=1&start=0&limit=20", function(text, status){
       console.log("status:" + status + "  text:" + text);
   });*/
   //获取当前时间，非工作时间机器人休息(存在小概率超时问题，9点5分钟前的单，下个工作日会超时，故关闭)
   /*var now = new Date();
   var hours = now.getHours();
   var day = now.getDay();
   if(hours >= 18 || hours < 9 || day == 6 || day == 0){
      console.log("机器人休息中。。。");
      return;
   }*/
   
   $("#button-1037-btnIconEl").click();
   console.log('刷新工单。。。');
   //获取页数
   var pages = $("#tbtext-1065").text();
   pages = parseInt(pages.substring(4, pages.length-2));
   for(var i = 0; i < pages; i++){
      console.log("开始查询第" + (i+1) + "页工单。");
      if(i > 0){
	    $("#button-1067-btnIconEl").click(); //下一页
	  }
      //检查是否有需要处理的工单
      setTimeout(function (){checkTickets();}, 5000);
   }
   
}

$(function(){
setInterval( function() {
    freshTickets();
  }, 300000);
});