$(document).ready(function() {

	$.ajaxSetup({
		xhrFields: {
			withCredentials: true
		},
		crossDomain: true
	});
	
	
	if(getCookie('rmbUser')=='true'){
		$("#rmbUser").attr("checked", "checked");
		$("#username").val(getCookie("userName"));
		$("#password").val(getCookie("passWord"));
	}
	
	function saveUserInfo(){
		if($("#rmbUser").attr("checked")=='checked'){
			var username=$("#username").val();
			var password=$("#password").val();
			setCookie('rmbUser','true');
			setCookie('userName',username);
			setCookie('passWord',password);
		}
		else{
			delCookie('rmbUser');
			delCookie('userName');
			delCookie('passWord');
		}
	}
	
	//保存cookies
	function setCookie(name, value) {
		document.cookie = name + "=" + value;
	}

	//读取cookies 
	function getCookie(name) {
		var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");

		if (arr = document.cookie.match(reg))

			return unescape(arr[2]);
		else
			return null;
	}

	//删除cookies 
	function delCookie(name) {
		var exp = new Date();
		exp.setTime(exp.getTime() - 1);
		var cval = getCookie(name);
		if (cval != null)
			document.cookie = name + "=" + cval + ";expires=" + exp.toGMTString();
	}
	
	var z = 0; //判断聊天列表是否有变化
	var user = null; //用户id
	var psinfo = null;
	var judgeFlist = 0; //判断是否已经获取过好友
	var flist = null; //好友列表
	var clist = null; //聊天列表
	var currentFlist = 0; //目前是否在好友列表
	var clistID = new Array();
	var analysisFriends = null; //解析好友列表json
	var friends = new Array(); //存放好友信息
	var currentUser = null; //目前哪个好友获得焦点
	var currentUserPosition = 0; //目前好友在好友列表的位置
	var mapF = {}; //好友名字未得到时先在每一项加入一个标签
	var chatid = null;
	var temporaryId = null;
	var chatF; //存放未读消息里好友的id
	var chatPosition = {};
	var judgeExist = {};
	var ex=false;
	var op=false;

	var getFList = function() { //获取好友列表
		$.post("http://cheewp.duapp.com/WeChat/?action=Friend&method=getFriendsList",
			function(date) {
				analysisFriends = eval("(" + date + ")");
				if (analysisFriends.statue == "error")
					alert(analysisFriends.error);
				else {
					for (var i = 0; i < analysisFriends.length; i++) {
						friends[analysisFriends[i].userid] = new Object();
						var li = $("<li></li>");
						var img = $("<img>").attr("src", "img/userHead.png");
						var span = $("<span></span>");
						friends[analysisFriends[i].userid].remark = analysisFriends[i].remark;
						$.post("http://cheewp.duapp.com/WeChat/?action=User&method=getUserById", {
								userid: analysisFriends[i].userid
							},
							function(date) {
								var b = eval("(" + date + ")");
								var span = mapF[b.userid];

								friends[b.userid].nickName = b.nickName; //获取好友信息
								friends[b.userid].age = b.age;
								friends[b.userid].email = b.email;
								friends[b.userid].introduction = b.introduction;
								friends[b.userid].sex = b.sex;

								if (friends[b.userid].remark == undefined) //如果备注为null，获取用户nickname			
								{
									span.text(friends[b.userid].nickName);
								} else {
									span.text(friends[b.userid].remark);
								}
							});

						li.append(img, span);
						mapF[analysisFriends[i].userid] = span;
						$(".flist").append(li);
					}
				}
				judgeFlist = 1;

				flist = $(".flist").children("li"); //好友列表每一项绑定click	
				/*alert(flist.length);*/
				for (var j = 0; j < flist.length; j++) {
					(function(i) {
						$(flist[i]).on("click", function() {
							$(flist[i]).addClass("clickFriend");
							$(flist[i]).siblings().removeClass("clickFriend");
							$(".id").text(analysisFriends[i].userid);
							currentUser = analysisFriends[i].userid;
							currentUserPosition = i;

							$("#remark").val(friends[currentUser].remark); //显示备注
							$(".FNickname").text(friends[analysisFriends[i].userid].nickName);
							if (friends[analysisFriends[i].userid].sex == '男') {
								$(".FSex").removeClass("female");
								$(".FSex").addClass("male");
							}
							if (friends[analysisFriends[i].userid].sex == '女') {
								$(".FSex").removeClass("male");
								$(".FSex").addClass("female");
							}
							$(".FIntroduce").text(friends[analysisFriends[i].userid].introduction);
							$(".age").text(friends[analysisFriends[i].userid].age);
							$(".email").text(friends[analysisFriends[i].userid].email);

							temporaryId = analysisFriends[i].userid; //获取好友id，用于聊天

							$(".titleTxt").text("详细信息");
							$(".finfoArea,.flist").removeClass("hide");
							$(".finfoArea,.flist").addClass("show");
							$(".usinfoArea,.chatArea,.clist,.noMessage").removeClass("show");
							$(".usinfoArea,.chatArea,.clist,.noMessage").addClass("hide");
						});
					})(j);
				}
			});
	};

	function scrollToBottom() {
		$("#cAMain").scrollTop($("#cAMain")[0].scrollHeight);
	};

	var sendmessage = function() { //发送消息
		var value = $("#cAContent").val();
		if (value) {
			$.post("http://cheewp.duapp.com/WeChat/?action=Message&method=sendTo", {
					userid: chatid,
					content: value
				},
				function(date) {
					var a = eval("(" + date + ")");
					if (a.statue == "success") {
						var pTime = $("<p></p>"); //显示时间
						pTime.addClass("time");
						var spanTime = $("<span></span>");
						var mydate = new Date();
						var year = mydate.getFullYear();
						var month = mydate.getMonth();
						month++;
						if (month < 10) {
							month = '0' + month;
						}
						var date = mydate.getDate();
						if (date < 10) {
							date = '0' + date;
						}
						var hour = mydate.getHours();
						if (hour < 10) {
							hour = '0' + hour
						};
						var minute = mydate.getMinutes();
						if (minute < 10) {
							minute = '0' + minute
						};
						var second = mydate.getSeconds();
						if (second < 10) {
							second = '0' + second
						};
						spanTime.text(year + '-' + month + '-' + date + '  ' + hour + ':' + minute + ':' + second);
						pTime.append(spanTime);
						$("#cAMain").append(pTime);

						var pRight = $("<p></p>");
						pRight.addClass("right");
						var spanContent = $("<span></span>");
						spanContent.addClass("spanR");
						var img = $("<img>").attr("src", "img/userHead.png");
						img.addClass("userHead");
						if(/<img[^>]*?(src="[^"]*?")[^>]*?>/.test(value)){
							spanContent.html(value);
						}
						else{
							spanContent.text(value);
						}	
						pRight.append(spanContent, img);
						$("#cAMain").append(pRight);
						scrollToBottom();

						friends[chatid].chatRecord = $("#cAMain").html();
					} else {
						alert(a.error);
					}
				});
		}
		$("#cAContent").val("");
	};

	var unreadID = function() { //显示未读消息聊天列表
		$.post("http://cheewp.duapp.com/WeChat/?action=Message&method=getUnreadUserId",
			function(date) {
				chatF = eval("(" + date + ")");
				if (chatF.statue == "error") {} else {
					if (chatF.length != 0) {
						if (currentFlist == 1) {
							$(".tabItem1").addClass("unread");
						}

						for (var i = 0; i < chatF.length; i++) {
							if (judgeExist[chatF[i]] != 1) {
								var li = $("<li></li>");
								var img = $("<img>").attr("src", "img/userHead.png");
								var span = $("<span></span>");
								if (friends[chatF[i]].remark == undefined) //如果备注为null，获取用户nickname			
								{
									span.text(friends[chatF[i]].nickName);
								} else {
									span.text(friends[chatF[i]].remark);
								}

								li.addClass("unread"); //添加小红点
								li.append(img, span);
								$(".clist").prepend(li);
								judgeExist[chatF[i]] = 1; //等于1时表示已出现在聊天列表中
								clistID.unshift(chatF[i]);
								z = 1;
							}

							if (z == 1) {
								z = 0;
								clist = $(".clist").children("li");
								for (var j = 0; j < clist.length; j++) {
									(function(i) {
										chatPosition[clistID[i]] = i;
										$(clist[i]).on("click", function() {
											$(".noMessage").removeClass("show");
											$(".noMessage").addClass("hide");
											$(".chatArea").addClass("show");
											$(".chatArea").removeClass("hide");
											$(clist[i]).removeClass("unread");
											$("#cAMain").html("");
											$("#cAContent").val("");
											$(".expressions").hide();
											chatid = clistID[i]; //获取当前对话框好友的id
											if (friends[chatid].chatRecord == undefined) {
												$.post("http://cheewp.duapp.com/WeChat/?action=Message&method=getRecentByUserId", {
														userid: chatid,
														number: 20,
													},
													function(date) {
														var record = eval("(" + date + ")");
														if (record.statue == "error") {} else {
															for (var k = record.length - 1; k >= 0; k--) {

																var pTime = $("<p></p>"); //显示时间
																pTime.addClass("time");
																var spanTime = $("<span></span>");
																spanTime.text(record[k].time);
																pTime.append(spanTime);
																$("#cAMain").append(pTime);
																if (record[k].fromUserId == chatid) {
																	var pLeft = $("<p></p>");
																	pLeft.addClass("left");
																	var spanContent = $("<span></span>");
																	spanContent.addClass("spanL");
																	var img = $("<img>").attr("src", "img/userHead.png");
																	img.addClass("userHead");
																	if(/<img[^>]*?(src="[^"]*?")[^>]*?>/.test(record[k].content)){
																		spanContent.html(record[k].content);
																	}
																	else{
																		spanContent.text(record[k].content);
																	}									
																	pLeft.append(img, spanContent);
																	$("#cAMain").append(pLeft);
																}
																if (record[k].fromUserId == user.userid) {
																	var pRight = $("<p></p>");
																	pRight.addClass("right");
																	var spanContent = $("<span></span>");
																	spanContent.addClass("spanR");
																	var img = $("<img>").attr("src", "img/userHead.png");
																	img.addClass("userHead");
																	if(/<img[^>]*?(src="[^"]*?")[^>]*?>/.test(record[k].content)){
																		spanContent.html(record[k].content);
																	}
																	else{
																		spanContent.text(record[k].content);
																	}				
																	pRight.append(spanContent, img);
																	$("#cAMain").append(pRight);
																}
															}
															friends[chatid].chatRecord = $("#cAMain").html();
															scrollToBottom();
														}
													});
											} else {
												$("#cAMain").html(friends[chatid].chatRecord);
												scrollToBottom();
											}

											$(clist[i]).removeClass("unread");
											$(clist[i]).addClass("clickFriend");
											$(clist[i]).siblings().removeClass("clickFriend");
											$(".titleTxt").text($(clist[i]).children("span").text());
											$.post("http://cheewp.duapp.com/WeChat/?action=Message&method=getUnreadByUserId", {
													userid: chatid,
												},
												function(date) {
													var content = eval("(" + date + ")");
													if (content.statue == "error") {} else {
														for (var k = 0; k < content.length; k++) {
															var pTime = $("<p></p>"); //显示时间
															pTime.addClass("time");
															var spanTime = $("<span></span>");
															spanTime.text(content[k].time);
															pTime.append(spanTime);
															$("#cAMain").append(pTime);

															var pLeft = $("<p></p>");
															pLeft.addClass("left");
															var spanContent = $("<span></span>");
															spanContent.addClass("spanL");
															var img = $("<img>").attr("src", "img/userHead.png");
															img.addClass("userHead");
															if(/<img[^>]*?(src="[^"]*?")[^>]*?>/.test(content[k].content)){
																spanContent.html(content[k].content);
															}
															else{
																spanContent.text(content[k].content);
															}			
															pLeft.append(img, spanContent);
															$("#cAMain").append(pLeft);
														}
														scrollToBottom();

														friends[chatid].chatRecord = $("#cAMain").html();
													}
												});
										});
									})(j);
								}
							}
							if (judgeExist[chatF[i]] == 1) {
								var m = chatPosition[chatF[i]];
								$(clist[m]).addClass("unread");
							}
						}
					}
				}
			});
	};

	function displayUnread() {
		if (chatid) {
			$(clist[chatPosition[chatid]]).removeClass("unread");
			$.post("http://cheewp.duapp.com/WeChat/?action=Message&method=getUnreadByUserId", {
					userid: chatid,
				},
				function(date) {
					var content = eval("(" + date + ")");
					if (content.statue == "error") {} else {
						if (content.length != 0) {
							for (var k = 0; k < content.length; k++) {
								var pTime = $("<p></p>");
								pTime.addClass("time");
								var spanTime = $("<span></span>");
								spanTime.text(content[k].time);
								pTime.append(spanTime);
								$("#cAMain").append(pTime);

								var pLeft = $("<p></p>");
								pLeft.addClass("left");
								var spanContent = $("<span></span>");
								spanContent.addClass("spanL");
								var img = $("<img>").attr("src", "img/userHead.png");
								img.addClass("userHead");
								if(/<img[^>]*?(src="[^"]*?")[^>]*?>/.test(content[k].content)){
									spanContent.html(content[k].content);
								}
								else{
									spanContent.text(content[k].content);
								}		
								pLeft.append(img, spanContent);
								$("#cAMain").append(pLeft);
							}
							scrollToBottom();
						}

					}
				});
		}
	};

	var chatlist = function() { //显示聊天列表
		$(".tabItem1").addClass("tabItem1a");
		$(".tabItem2").removeClass("tabItem2a");
		$(".titleTxt").text("聊天");
		$(".chatArea,.clist").removeClass("hide");
		$(".chatArea,.clist").addClass("show");
		$(".finfoArea,.usinfoArea,.flist,.noMessage").removeClass("show");
		$(".finfoArea,.usinfoArea,.flist,.noMessage").addClass("hide");
		$(".clist").children("li").removeClass("clickFriend");
		$("#cAMain").html("");
		currentFlist = 0;
		$(".tabItem1").removeClass("unread");
		if (chatid == null) {
			$(".titleTxt").text("");
			$(".chatArea").removeClass("show");
			$(".chatArea").addClass("hide");
			$(".noMessage").removeClass("hide");
			$(".noMessage").addClass("show");
		}
	};

	var login = function() { //登录
		saveUserInfo();
		$.post("http://cheewp.duapp.com/WeChat/?action=User&method=login", {
				username: $("#username").val(), //字符串，用户名 
				password: $("#password").val(), //字符串，密码 
			},
			function(date) {
				user = eval("(" + date + ")");
				if (user.statue == "success") {
					analysisFriends = null;
					judgeFlist = 0;
					chatid = null;
					$("#optionMenu").hide();
					$(".titleTxt").text("");
					$(".inner,.clist,.noMessage").addClass("show");
					$(".noMessage,.clist").removeClass("hide");
					$(".loginPage,.flist,.usinfoArea,.finfoArea,.chatArea").addClass("hide");
					$(".finfoArea,.flist,.usinfoArea,.finfoArea,.chatArea").removeClass("show");
					$(".flist,.clist").html("");
					$(".tabItem1").addClass("tabItem1a"); //显示聊天列表
					$(".tabItem2").removeClass("tabItem2a");
					$("#cAMain").html("");

					$.post("http://cheewp.duapp.com/WeChat/?action=User&method=getUserById", //获取用户信息
						{
							userid: user.userid,
						},
						function(date) {
							psinfo = eval("(" + date + ")");
							$("#displayName").text(psinfo.nickName);
							$("#nickname").val(psinfo.nickName);
							$("#age").val(psinfo.age);
							$("#sex").val(psinfo.sex);
							$("#it").val(psinfo.introduction);
							$("#email").val(psinfo.email);
							age = psinfo.age;
							email = psinfo.email;
						}
				);
				
				
					chatlist();
					expression();
					
					if (judgeFlist == 0) { //获取好友列表+是否有未读消息
						getFList();
					}
					
					time1=setInterval(unreadID, 3000);
					time2=setInterval(displayUnread, 2000);
					
				} else {
					alert(user.error);
				}
			});
	};

	$("#login").click(login);
	$("#username").keydown(function(e) {
		var curkey = e.which;
		if (curkey == 13) {
			login();
		}
	});
	$("#password").keydown(function(e) {
		var curkey = e.which;
		if (curkey == 13) {
			login();
		}
	});

	$("#option").click(function() {
		if(op==false){
			$("#optionMenu").show();
			op=true;
		}
		else{
			$("#optionMenu").hide();
			op=false;
		}
		
		return false;
	});

	$("#logout").click(function() { //退出登录
		$.post("http://cheewp.duapp.com/WeChat/?action=User&method=logout",
			function(date) {
				var txt = eval("(" + date + ")");
				if (txt.statue == "success") {
					user = null;
					$(".loginPage").removeClass("hide");
					$(".inner").removeClass("show");
					$("#username,#password,#remark").val("");
					$(".FNickname,.FIntroduce,.age,.email").text("");
					$(".FSex").removeClass("female");
					$(".FSex").removeClass("male");
					
					clearInterval(time1);
					clearInterval(time2);
				}
			}
		);
		judgeFlist = 0;
	});

	$("#userinfo").click(function() {
		$(".titleTxt").text("个人信息");
		$("#optionMenu").hide();
		$(".usinfoArea").removeClass("hide");
		$(".usinfoArea").addClass("show");
		$(".chatArea,.finfoArea,.noMessage").removeClass("show");
		$(".chatArea,.finfoArea,.noMessage").addClass("hide");
	});

	$("#update").click(function() { //修改个人信息
		$.post("http://cheewp.duapp.com/WeChat/?action=User&method=update", {
				nickname: $("#nickname").val(),
				age: $("#age").val(),
				sex: $("#sex").val(),
				introduction: $("#it").val(),
				email: $("#email").val(),
			},
			function() {
				var a = $("#nickname").val();
				$("#displayName").text(a);
				age = $("#age").val();
				email = $("#email").val();
			});
	});

	$("#email").blur(function() {
		var val = $("#email").val();
		if (/\w+@+\w+.+\w+$/.test(val) == false) {
			alert("格式错误");
			$("#email").val(email);
		} else {
			email = val;
		}
	});

	$("#age").blur(function() {
		var val = $("#age").val();
		if (/\d$/.test(val) == false) {
			alert("不是数字");
			$("#age").val(age);
		} else {
			age = val;
		}
	});

	$(".tabItem2").click(function() { //点击好友列表
		$(".tabItem2").addClass("tabItem2a");
		$(".tabItem1").removeClass("tabItem1a");
		$(".titleTxt").text("详细信息");
		$(".finfoArea,.flist").removeClass("hide");
		$(".finfoArea,.flist").addClass("show");
		$(".usinfoArea,.chatArea,.clist,.noMessage").removeClass("show");
		$(".usinfoArea,.chatArea,.clist,.noMessage").addClass("hide");
		currentFlist = 1;
		chatid = null;
	});

	$("#remark").blur(function() { //修改好友备注
		var value = $("#remark").val();
		$.post("http://cheewp.duapp.com/WeChat/?action=Friend&method=setRemark", {
				userid: currentUser,
				remark: value
			},
			function(date) {
				var r = eval("(" + date + ")");
				if (r.statue == "success") {
					$(flist[currentUserPosition]).children("span").text(value);
					friends[currentUser].remark = value;
					if (judgeExist[temporaryId] == 1) {
						$(clist[chatPosition[temporaryId]]).children("span").text(value);
					}
				} else {
					$("#remark").val(friends[temporaryId].remark);
				}
			});
	});

	$(".tabItem1").click(function() {
		chatid = null;
		chatlist();
	});

	$("#sendmg").click(function() { //选定好友发消息
		chatid = temporaryId;
		if (chatid) {
			chatlist();
			if (judgeExist[chatid] != 1) {
				var li = $("<li></li>");
				var img = $("<img>").attr("src", "img/userHead.png");
				var span = $("<span></span>");
				if (friends[chatid].remark) {
					span.text(friends[chatid].remark);
					$(".titleTxt").text(friends[chatid].remark);
				} else {
					span.text(friends[chatid].nickName);
					$(".titleTxt").text(friends[chatid].nickName);
				}
				li.addClass("clickFriend");
				li.append(img, span);
				$(".clist").prepend(li);
				li.siblings().removeClass("clickFriend");

				judgeExist[chatid] = 1;
				clistID.unshift(chatid);

				clist = $(".clist").children("li");
				for (var j = 0; j < clist.length; j++) {
					(function(i) {
						chatPosition[clistID[i]] = i;
						$(clist[i]).on("click", function() {
							$(".noMessage").removeClass("show");
							$(".noMessage").addClass("hide");
							$(".chatArea").addClass("show");
							$(".chatArea").removeClass("hide");
							$(clist[i]).removeClass("unread");
							$(clist[i]).removeClass("unread");
							$("#cAMain").html("");
							$("#cAContent").val("");
							$(".expressions").hide();
							chatid = clistID[i]; //获取当前对话框好友的id
							if (friends[chatid].chatRecord == undefined) {
								$.post("http://cheewp.duapp.com/WeChat/?action=Message&method=getRecentByUserId", {
										userid: chatid,
										number: 20,
									},
									function(date) {
										var record = eval("(" + date + ")");
										if (record.statue == "error") {} else {
											for (var k = record.length - 1; k >= 0; k--) {

												var pTime = $("<p></p>"); //显示时间
												pTime.addClass("time");
												var spanTime = $("<span></span>");
												spanTime.text(record[k].time);
												pTime.append(spanTime);
												$("#cAMain").append(pTime);
												if (record[k].fromUserId == chatid) {
													var pLeft = $("<p></p>");
													pLeft.addClass("left");
													var spanContent = $("<span></span>");
													spanContent.addClass("spanL");
													var img = $("<img>").attr("src", "img/userHead.png");
													img.addClass("userHead");
													if(/<img[^>]*?(src="[^"]*?")[^>]*?>/.test(record[k].content)){
									spanContent.html(record[k].content);
								}
													
													else{
														spanContent.text(record[k].content);
													}
													pLeft.append(img, spanContent);
													$("#cAMain").append(pLeft);
												}
												if (record[k].fromUserId == user.userid) {
													var pRight = $("<p></p>");
													pRight.addClass("right");
													var spanContent = $("<span></span>");
													spanContent.addClass("spanR");
													var img = $("<img>").attr("src", "img/userHead.png");
													img.addClass("userHead");
													if(/<img[^>]*?(src="[^"]*?")[^>]*?>/.test(record[k].content)){
														spanContent.html(record[k].content);
													}
													else{
														spanContent.text(record[k].content);
													}
													pRight.append(spanContent, img);
													$("#cAMain").append(pRight);
												}

											}
											scrollToBottom();
											friends[chatid].chatRecord = $("#cAMain").html();
										}
									});
							} else {
								$("#cAMain").html(friends[chatid].chatRecord);
								scrollToBottom();
							}

							$(clist[i]).removeClass("unread");
							$(clist[i]).addClass("clickFriend");
							$(clist[i]).siblings().removeClass("clickFriend");
							$(".titleTxt").text($(clist[i]).children("span").text());
							$.post("http://cheewp.duapp.com/WeChat/?action=Message&method=getUnreadByUserId", {
									userid: chatid,
								},
								function(date) {
									var content = eval("(" + date + ")");
									if (content.statue == "error") {} else {
										for (var k = 0; k < content.length; k++) {
											var pTime = $("<p></p>"); //显示时间
											pTime.addClass("time");
											var spanTime = $("<span></span>");
											spanTime.text(content[k].time);
											pTime.append(spanTime);
											$("#cAMain").append(pTime);

											var pLeft = $("<p></p>");
											pLeft.addClass("left");
											var spanContent = $("<span></span>");
											spanContent.addClass("spanL");
											var img = $("<img>").attr("src", "img/userHead.png");
											img.addClass("userHead");
											if(/<img[^>]*?(src="[^"]*?")[^>]*?>/.test(content[k].content)){
												spanContent.html(content[k].content);
											}
											else{
												spanContent.text(content[k].content);
											}		
											pLeft.append(img, spanContent);
											$("#cAMain").append(pLeft);
										}
										scrollToBottom();

										friends[chatid].chatRecord = $("#cAMain").html();
									}
								});
						});
					})(j);
				}
				$(clist[0]).click();
			}
		}
		if (judgeExist[chatid] == 1) {
			var m = chatPosition[chatid];
			$(clist[m]).click();
		}
	});

	$("#send").click(sendmessage);

	$("#cAContent").keypress(function(e) {
		if (e.ctrlKey && e.which == 10) {
			sendmessage();
		}
	});
	
	$(".expression").click(function(){
		if(ex==false){
			$(".expressions").show();
			ex=true;
		}
		else{
			$(".expressions").hide();
			ex=false;
		}
		
		return false;
	});
	
	function expression(){
		var ep=$(".expressions").children("div");
		for(var i=0;i<ep.length;i++){
			(function(j){
				$(ep[j]).on("click",function(){
					var bgurl=$(ep[j]).css("background-image");
					if(bgurl[bgurl.length-2]=='"'){
						var src=/img.*"/.exec(bgurl);
						var value=$("#cAContent").val();
						var value2=value+'<img src="./'+src+'>';
					}
					else{
						var src=/img.*\)/.exec(bgurl);
						src=src[0].substring(0,src[0].length-1);
						var value=$("#cAContent").val();
						var value2=value+'<img src="./'+src+'">';
					}
					$("#cAContent").val(value2);
					$("#cAContent").focus();
				});
			})(i);
		}
	};
	
	$("body").click(function(){
		if(ex==true){
			$(".expressions").hide();
			ex=false;
		}
		if(op==true){
			$("#optionMenu").hide();
			op=false;
		}
	});

	
});