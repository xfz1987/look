//动画逻辑程序对象
var Qixi = function(){
    //配置项
    var config = {
        keepZoomRatio : false,       //是否正比缩放
        layer : {                    //页面布局配置
            'width' : '100%',
            'height' : '100%',
            'top' : 0,
            'left' : 0
        },
        audio : {                    //音频配置
            enable : true,
            playURL : 'music/happy.wav',
            cycleURL : 'music/circulation.wav'
        },
        setTime : {                  //动画执行时间配置
            walkToThird : 6000,
            walkToMiddle : 6500,
            walkToEnd : 6500,
            walkTobridge : 2000,
            bridgeWalk : 2000,
            walkToShop : 1500,
            walkOutShop : 1500,
            openDoorTime : 800,
            shutDoorTime : 500,
            waitRotate : 850,
            waitFlower : 800
        },
        snowflakeURL: [            //雪花图片配置
            'images/snowflake/snowflake1.png',
            'images/snowflake/snowflake2.png',
            'images/snowflake/snowflake3.png',
            'images/snowflake/snowflake4.png',
            'images/snowflake/snowflake5.png',
            'images/snowflake/snowflake6.png'
        ]
    };

    if(config.keepZoomRatio){
        var proportionY = $(document).width()/1440;
        var screenHeight = $(document).height();
        var zoomHeight = screenHeight * proportionY;
        var zoomTop = (screenHeight - zoomHeight)/2;
        config.layer.height = zoomHeight;
        config.layer.top = zoomTop;
    }

    var instanceX;
    var container = $('.content');
    container.css(config.layer);
    var visualWidth = container.width();
    var visualHeight = container.height();

    //获取走路的路线坐标
    var getValue = function(className){
        var $elem = $(className);
        return {
            height: $elem.height(),
            top: $elem.position().top
        };
    };

    //获取路的top值
    var pathY = function(){
        //路要沿着中间直线行走
        var data = getValue('.a_background_middle');
        return data.top + data.height / 2;
    }();

    //获取桥的top值
    var bridgeY = function(){
        var data = getValue('.c_background_middle');
        return data.top;
    }();

    //获取兼容性动画结束事件名称
    var animationEnd = (function(){
        var explorer = navigator.userAgent;
        //为什么用~取反
        //方式一: explorer.indexOf('WebKit') != -1
        //方式二: ~explorer.indexOf('WebKit')
        //如果没有找到 ~(-1) = 0;
        if(~explorer.indexOf('WebKit')){
            return 'webkitAnimationEnd';
        }
        return 'animationend';
    })();

    //判断是否播放音乐
    if(config.audio.enable){
        var _audio = AudioPlay(config.audio.playURL);
        _audio.end(function(){//当音乐结束时,接着播放
            AudioPlay(config.audio.cycleURL,true);
        });
    }

    //背景音乐对象
    function AudioPlay(url,isloop){
        var audio = new Audio(url);
        audio.autoPlay = true;
        audio.loop = isloop || false;
        audio.play();
        return {
            end : function(callback){
                //监听音乐是否播放完成，完成后执行回掉函数
                audio.addEventListener('ended',function(){
                    callback();
                },false);
            }
        };
    }

    //背景移动
    var swipe = Swipe(container);
    //proportionX:表示占容器宽度的百分比，time执行时间
    function scrollTo(time,proportionX) {
        var distX = visualWidth * proportionX;
        swipe.scrollTo(distX,time);
    }

    //小女孩
    var girl = {
        elem : $('.girl'),
        getHeight : function(){
            return this.elem.height();
        },
        //转身动作
        rotate : function(){
            this.elem.addClass('girl-rotate');
        },
        setPos : function(){
            this.elem.css({
                left : visualWidth/2,
                top : bridgeY - this.getHeight()
            });
        },
        getPos : function(){
            return this.elem.position();
        },
        getWidth : function(){
            return this.elem.width();
        }
    };

    //小鸟
    var bird = {
        elem : $('.bird'),
        fly : function() {
            this.elem.addClass('bird-fly');
            this.elem.transition({
                right:container.width()
            }, 15000, 'linear');
        }
    };

    //logo
    var logo = {
        elem : $('.logo'),
        run:function(){
            //给一个元素增加两个动画的类，1执行完，再执行2
            this.elem.addClass('logolightSpeedIn')
                     .on('animationend',function(){
                        $(this).addClass('logoshake').off();//off移除animationEnd事件
                     });
        }
    };

    // 太阳公转
    $(".sun").addClass('rotation');

    // 云儿动
    $('.cloud1').addClass('cloud1Anim');
    $('.cloud2').addClass('cloud2Anim');

    //小男孩
    var boy = Walk();
    /*小男孩子所有的动作分解
      小男孩只是在一个页面里面 li 行走，同时页面切换，这样感官上感觉小男孩走了三个场景
     走路到页面的2/3的时候，主题页面开始滑动
     走路到1/2的时候，到了商店门口
     进出商店,进商店灯亮，出商店等灭，拿鲜花，继续向前走路
     走路到桥边
     走路上桥
     桥上置行
     送花，转身，心里美，飘雪花啦
     注意：走到桥边，上桥，桥上直行三个动作都是以小女孩为参考点
     男孩最终的位置: left = girl.left - boy.getWidth()
                     top = girl.top
    */
    boy.walkTo(config.setTime.walkToThird,0.6)//走到以一个页面3/5的距离
       .then(function(){
           scrollTo(config.setTime.walkToMiddle,1);//将背景移动到第二幅场景
           return boy.walkTo(config.setTime.walkToMiddle,0.5);
       })
       .then(function(){
           bird.fly();
       })
       .then(function(){
           boy.stopWalk();//暂停走路
           return BoyToShop(boy);//去商店买花
       })
       .then(function(){
           girl.setPos();//修正小姑娘的位置
           scrollTo(config.setTime.walkToEnd,2);//将背景移动到第三幅场景
           return boy.walkTo(config.setTime.walkToEnd,0.15);//小男孩走到桥边
       })
       .then(function(){
           //小男孩上桥，y轴，bug：假定了小男孩和小女孩一边高了，也是就top是一样的值了
           //return boy.walkTo(config.setTime.walkTobridge,0.25,(bridgeY - girl.getHeight())/visualHeight);
           return boy.walkTo(config.setTime.walkTobridge,0.25,(bridgeY - boy.getHeight())/visualHeight);
       })
       .then(function(){
           //x轴实际走路的比例（girl坐标 - 男男孩已走的距离 - 男孩的宽 + 牵手距离[]）
           var proportionX = (girl.getPos().left - instanceX- boy.getWidth()  + girl.getWidth() / 5) / visualWidth;
           //在桥上直走到小女孩面前
           return boy.walkTo(config.setTime.bridgeWalk,proportionX);
       }).then(function(){
           //还原小男孩手中没花的原地停止状态
           boy.resetOriginal();
           //对视一会，然后两人同时转身
           setTimeout(function(){
                girl.rotate();
                boy.rotate(function(){
                    //开始logo动画
                    logo.run();
                    //开始飘雪花动画
                    snowflake();
                });
           },config.setTime.waitRotate);
       });

    //小男孩走路动作对象
    function Walk(){
        var $boy = $("#boy");
        var boyHeight = $boy.height();
        var boyWidth = $boy.width();
        // 修正小男孩的正确位置 小top坐标值 = 中间路段的中间坐标值 - 小男孩的高度
        $boy.css({
            top: pathY - boyHeight + 25
        });

        /*----------------动画处理-----------------*/
        //暂停走路
        function pauseWalk(){
            $boy.addClass('pauseWalk');
        }
        //恢复走路
        function restoreWalk(){
            $boy.removeClass('pauseWalk');
        }

        //增加原地踏步动作
        function slowWalk(){
            $boy.addClass('slow-walk');
        }

        /**
        *  计算移动距离
        * @param  direction  x轴或y轴方向
        * @param  proportion 占当前活动页面的百分比
        */
        function calculateDist(direction,proportion){
            return (direction == 'x' ? visualWidth : visualHeight) * proportion;
        }

        //运动开关(transition)
        function stratRun(options,runTime){
            var dfdPlay = $.Deferred();
            //恢复走路
            restoreWalk();
            //增加小男孩原地行走的过渡属性
            $boy.transition(options,runTime,'linear',function(){
                dfdPlay.resolve(); //过渡动作完成时，将defferedd对象状态设置为‘已完成’，在外面then就可以立即执行了
            });
            return dfdPlay;
        }

        //开始走路
        function walkRun(time,distX,disY) {
            time = time || 3000;
            //脚动作
            slowWalk();
            //开始走路
            var d1 = stratRun({
                'left' : distX + 'px',
                'top' : disY ? disY : undefined
            },time);
            return d1;
        }

        //走进商店
        function walkIntoShop(time){
            var defer = $.Deferred();
            var $door = $('.door');
            //门的坐标
            var offsetDoor = $door.offset();
            var dol = offsetDoor.left;
            //小孩当前坐标
            var offsetBoy = $boy.offset();
            var bol = offsetBoy.left;

            //当前场景小男孩需要移动的坐标(让小男孩走到门的中间，关键：在垂直方向，小男孩的中间与门的中间保持在一条垂直线上)
            instanceX = (dol + $door.width()/2) - (bol + $boy.width()/2);

            //小男孩移动到门中间的位置
            var walkPlay = stratRun({
                transform:'translateX(' + instanceX + 'px),scale(0.3,0.3)',
                opacity: 0.1
            }, 2000);
            //走路完毕，执行done方法
            walkPlay.done(function(){
                $boy.css({opacity:0});
                defer.resolve();
            });
            return defer;
        }

        //走出商店
        function walkOutShop(time){
            var defer = $.Deferred();
            restoreWalk();
            //开始走路
            var walkPlay = stratRun({
                transform:'translateX(' + instanceX + 'px) scale(1,1)',
                opacity:1
            }, time);
            //走路完毕
            walkPlay.done(function(){
                defer.resolve();
            });
            return defer;
        }

        return {
            //走路
            walkTo : function(time, proportionX, proportionY){
                var distX = calculateDist('x', proportionX);
                var distY = calculateDist('y', proportionY);
                return walkRun(time, distX, distY);
            },
            //停止走路
            stopWalk : function(){
                pauseWalk();
            },
            //走进商店
            toShop : function(){
                return walkIntoShop.apply(null, arguments);
            },
            //走出商店
            outShop : function(){
                return walkOutShop.apply(null, arguments);
            },
            //取花
            takeFlower : function(){
                $boy.addClass('slowFlowerWalk');;
            },
            //获取男孩的宽度
            getWidth : function(){
                return $boy.width();
            },
            getHeight : function(){
                return $boy.height();
            },
            //复位初始状态(鲜花已经送出去了，停止走路)
            resetOriginal : function(){
                this.stopWalk();
                //恢复图片
                $boy.removeClass('slow-walk slowFlowerWalk').addClass('boyOriginal');
            },
            //转身
            rotate : function(callback) {
                restoreWalk();//恢复原地踏步
                $boy.addClass('boy-rotate');
                //执行回调函数
                if(callback){
                    //监控是否转完身
                    $boy.on(animationEnd,function(){
                        callback();
                        $(this).off();
                    });
                }
            }
        };
    }

    //进出商店对象
    var BoyToShop = function(boyObj){
        var defer = $.Deferred();
        var $door = $('.door');
        var doorLeft = $('.door-left');
        var doorRight = $('.door-right');

        //门动画
        function doorAction(left, right, time){
            var defer = $.Deferred();
            var count = 2;
            //等待开门完成
            var complete = function() {
                if (count == 1) {
                    defer.resolve();
                    return;
                }
                count--;
            };
            doorLeft.transition({'left':left}, time, complete);
            doorRight.transition({'left':right}, time, complete);
            return defer;
        }

        //开门
        function openDoor(time){
            return doorAction('-50%', '100%', time);
        }

        //关门
        function shutDoor(time){
            return doorAction('0%', '50%', time);
        }

        //鲜花
        function flower(){
            var defer = $.Deferred();
            //取花
            boyObj.takeFlower();
            //去完花停一下
            setTimeout(function(){
                defer.resolve();
            },config.setTime.waitFlower);
            return defer;
        }

        //灯动画
        var lamp = {
            elem : $('.b_background'),
            bright:function(){
                this.elem.addClass('lamp-bright');
            },
            dark:function(){
                this.elem.removeClass('lamp-bright');
            }
        };

        //开门及后续动作
        openDoor(config.setTime.openDoorTime)//门开了
        .then(function(){
            //灯亮
            lamp.bright();
            //小男孩走进商店
            return boyObj.toShop($door,config.setTime.walkToShop);
        })
        .then(function(){
            //进里面买花
            return flower();
        })
        .then(function(){
            //走出商店
            return boyObj.outShop(config.setTime.walkOutShop);
        })
        .then(function(){
            //关门
            shutDoor(config.setTime.shutDoorTime);
            //灯灭
            lamp.dark();
            defer.resolve();
        });
        return defer;
    };

    //雪花动画
    function snowflake(){
        var $flakeContainer = $('.snowflake');
        //随机选取图片
        function getImagesName(){
            return config.snowflakeURL[Math.floor(Math.random()*config.snowflakeURL.length)];
        }
        //创建一个雪花元素
        function createSnowBox(){
            var url = getImagesName();
            return $('<div class="snow"></div>').css('backgroundImage','url(' + url + ')').addClass('snowRoll');
        }
        //开始飘花
        setInterval(function(){
            //运动的轨迹
            var startPositionLeft = Math.random() * visualWidth - 100,
                startOpacity = 1,
                endPositionTop = visualHeight - 40,
                endPositionLeft = startPositionLeft - 100 + Math.random() * 500,
                duration = visualHeight * 10 + Math.random() * 5000;

            //随机透明度，不小于0.5
            var randomStart = Math.random();
            randomStart = randomStart < 0.5 ? startOpacity : randomStart;

            //创建一个雪花
            var $flake = createSnowBox();

            //设计起点位置
            $flake.css({left:startPositionLeft,opacity:randomStart});

            //加入到容器
            $flakeContainer.append($flake);

            //开始执行动画
            $flake.transition({
                top : endPositionTop,
                left : endPositionLeft,
                opacity : 0.7
            }, duration, 'ease-out', function(){
                //结束后删除该雪花节点
                $(this).remove();
            });
        }, 200);
    }
};

//页面滑动 //
function Swipe(container){
    //获取第一个子节点
    //var element = container.find('.content-wrap');
    var element = container.find(':first');
    //滑动对象
    var swipe = {};
    //li页面数量
    var slides = element.find('>');//element.find('li');
    //获取容器尺寸
    var width = container.width();
    var height = container.height();

    //设置li页面总宽度
    element.css({
        width: (slides.length * width) + 'px',
        height: height + 'px'
    });
    //设置每一个页面li的宽度
    for(var i=0,len=slides.length;i<len;i++){
        slides.eq(i).css({
            width:width+'px',
            height:height+'px'
        });
    }
    //var isComplete = false;
    //var timer;
    //var callbacks = {};

    //监控是否移动结束
    // container[0].addEventListener('transitionend',function(){
    //     isComplete = true;
    // },false);

    // function monitorOffset(element){
    //     timer = setTimeout(function(){
    //         if(isComplete){
    //             clearInterval(timer);
    //             timer = null;
    //             return;
    //         }
    //         callbacks.move(element.offset().left);
    //         monitorOffet(element);
    //     }, 500);
    // }

    //使用观察者模式,监控回掉函数(暂时没用上)
    // swipe.watch = function(eventName,callback){
    //     callbacks[eventName] = callback;
    // };

    //移动
    swipe.scrollTo = function(x, speed) {
        //执行动画移动
        element.css({
            'transition-timing-function' : 'linear',
            'transition-duration'        : speed + 'ms',
            'transform'                  : 'translate3d(-' + x + 'px,0px,0px)'
        });
        return this;
    };
    return swipe;
}

$(function(){
    Qixi();
});