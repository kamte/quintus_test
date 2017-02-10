
window.addEventListener("load", function(){

	var Q = Quintus({development: true, audioSupported: ['mp3','ogg']})
	.include("Scenes, Input, Sprites, UI, 2D, TMX, Anim, Touch, Audio")
	.setup("game")
	.controls()
	.touch()
	.enableSound();



    ////////////////////////////SPRITES////////////////////////////

    //COMPONENT
    Q.component("defaultEnemy", {
    	extend: {
    		bump: function(collision) {
    			if(collision.obj.isA("Player")) {
    				collision.obj.p.vy = -50;
    				collision.obj.p.dead = true;
    				setTimeout(function(){
    					Q.stage(0).pause();
    					Q.stageScene("endGame",2, { label: "You Died" });						
    				},500)
    			}
    		},
    		die: function() {
    			this.p.dead = true;
    			this.play('die');
    		}
    	}
    });


    Q.Sprite.extend("Enemy",{
    	init: function(p,defaults) {
    		this._super(p,Q._defaults(defaults||{},{
    			type: Q.SPRITE_ENEMY,
    			collisionMask: Q.SPRITE_DEFAULT,
    			dead: false,
    			deadTimer: 0,
    			deadMax: 10
    		}));

    		this.add('2d,animation,defaultEnemy');
    		this.on("bump.top",this,"die");
    		this.on("bump.left,bump.right",this,"bump");
    	}
    });

    Q.Enemy.extend("Goomba",{
    	init: function(p) {

    		this._super(p, {
    			sheet: "goomba",
    			sprite: "goomba",
    			vx: 100
    		});

    		this.add('aiBounce');
    		this.on("bump.bottom",this,"bump");
    	},
    	step: function(dt) {
    		if(this.p.y >= 560) {
    			this.destroy();
    		}
    		else {
    			if(!this.p.dead)
    				this.play("waddle");
    			else {
    				this.p.vx=0;
    				this.p.deadTimer++;
    				if(this.p.deadTimer > this.p.deadMax)
    					this.destroy();
    			}
    		}	
    	}
    });

    Q.Enemy.extend("Bloopa",{
    	init: function(p) {

    		this._super(p, {
    			sheet: "bloopa",
    			sprite: "bloopa",
    			rangeY: 70,
    			initialY: 0,
    			gravity: 0,
    			v:120
    		});
    		this.p.initialY=this.p.y;
    		this.p.vy=-this.p.v;
    		this.on("dead",this,"die");
    		this.on("bump.bottom",function(collision) {

    			if(collision.obj.isA("Player")) {
    				collision.obj.p.dead = true;
    				setTimeout(function(){
    					Q.stage(0).pause();
    					Q.stageScene("endGame",2, { label: "You Died" });			
    				},200)

    			}
    			else{	
    				this.p.vy=-this.p.v;
    			}
    		});
    	},
    	step: function(dt) {
    		if(!this.p.dead) {
    			this.play('jump');
    			if(this.p.initialY - this.p.y >= this.p.rangeY)
    				this.p.vy=this.p.v;
    		}
    		else {
    			this.vy=0;
    			this.p.deadTimer++;
    			if(this.p.deadTimer > this.p.deadMax)
    				this.destroy();
    		}
    	}

    });


    Q.Sprite.extend("Princess",{
    	init: function(p) {
    		this._super(p,{
    			asset: "princess.png",
    			x: 2020,
    			y: 455,
    			mPlayed: false
    		});
    		this.on("hit.sprite",this,function(collision){
    			if(collision.obj.isA("Player")) {
    				var cx = collision.obj.p.x;
    				var cy = collision.obj.p.y;
    				if (!this.p.mPlayed) {
    					this.p.mPlayed = true;
    					Q.audio.stop();
    					Q.audio.play('music_level_complete.ogg');
    				}

    				collision.obj.p.gravity=0;
    				collision.obj.animate({x:cx, y:cy-55, angle:360}, 0.8, 
    					{callback: function() {
    						Q.stage(0).pause();
    						Q.stageScene("endGame",2, { label: "You Won" });
    					}
    				});							
    			}
    		});
    	}
    });



    Q.Sprite.extend("Coin", {
    	init: function(p) {
    		this._super(p,{
    			sprite: "coin",
    			sheet: "coin",
    			gravity: 0, 
    			taken: false,
    			value: 1,
                sensor: true
    		});

    		this.add('animation,tween');
    		this.play("coin");
    		this.on("sensor",this,function(collision){
    			if(collision.isA("Player") && !this.p.taken) {
    				Q.audio.play('coin.ogg');
    				this.p.taken = true;
    				Q.state.inc("coins",this.p.value);
    				this.animate({x: this.p.x, y: this.p.y-20}, 1/8, {callback: function(){
    					this.destroy();}   
    				});  
    			}

    		});
    	}
    });


    Q.Sprite.extend("Player",{
    	init: function(p){
    		this._super(p, {
    			sprite: "player",
    			sheet: "marioR",
    			direction: "right",
    			jumpSpeed: -400,
    			jumped: false,
				x: 30,//480,//1344,//30,
				y: 528,//494,//528,
				dead: false,
				mPlayed: false
			});

    		this.add('2d, animation, platformerControls,tween');
    		this.on("bump.bottom",this,"stomp");
    		this.on("jump",this,function(){
    			this.play("marioJumpR");
    		});
    	},

    	step: function(dt){

			//console.log(this.p.x + " , " + this.p.y);

			//Check player death (from falling)
			if(this.p.y >= 560) {
				this.p.dead=true;
				Q.stage(0).pause();
				Q.stageScene("endGame",2, { label: "You Died" });
			}

			
			if(this.p.dead) {
				var that=this;
				if (!this.p.mPlayed) {
					this.p.mPlayed = true;
					Q.audio.stop();
					Q.audio.play('music_die.ogg');
				}
				this.play("marioDie");
				
				this.del('platformerControls');
				this.p.collisionMask=Q.SPRITE_NONE;
				
				
			}
			else {
				if(Q.inputs['right'])
					this.p.direction="right";
				if(Q.inputs['left'])
					this.p.direction="left";		
				if(Q.inputs['up']){
					if (!this.p.jumped)
						Q.audio.play('music_jump.ogg');
					this.p.jumped=true;

				}

				/////animate movement
				
				//Left & right
				if(this.p.vx != 0 && this.p.vy == 0) {
					if(Q.inputs['right'])
						this.play("marioR");
					if(Q.inputs['left'])
						this.play("marioL");
				}
				//Jumps
				else if(this.p.vy != 0 && this.p.jumped){
					if(this.p.direction==="right")
						this.play("marioJumpR");
					else
						this.play("marioJumpL");
				}
			}
			
		},

		stomp: function(collision) {

			if(collision.obj.isA("Goomba") || collision.obj.isA("Bloopa")) {
				Q.audio.play('stomp.ogg');
				this.p.vy = -300;
			}
			else { 
				if (!collision.obj.isA("Coin")) {
					if(this.p.jumped) {
						this.p.jumped = false;
						if(this.p.direction==="right")
							this.play("marioSR");
						else
							this.play("marioSL");
					}
				}
			}
		}
	});

    ////////////////////////////SCENES////////////////////////////
    Q.scene("level1",function(stage) {

    	Q.stageTMX("levelOK.tmx",stage);

    	var mario = stage.insert(new Q.Player());
    	stage.insert(new Q.Goomba({x:1478, y:494}));
    	stage.insert(new Q.Bloopa({x:1411.6, y:438}));
    	stage.insert(new Q.Goomba({x:1072, y:222}));

		stage.insert(new Q.Coin({x:528,y:500}));
		stage.insert(new Q.Coin({x:560,y:500}));
		stage.insert(new Q.Coin({x:630,y:500}));
		stage.insert(new Q.Coin({x:665,y:500}));

		stage.insert(new Q.Princess());

		
		stage.add("viewport").follow(mario, {x: true, y: false});
		stage.centerOn(165,365);
		stage.viewport.offsetX = -120;
		stage.viewport.offsetY = 180;	
	});

    Q.UI.Text.extend("Score",{
    	init: function(p) {
    		this._super({
    			label: "Coins: 0",
    			x: 0,
    			y: 10,
    			color: "black"
    		});
    		Q.state.on("change.coins",this,"coins");
    	},

    	coins: function(score) {
    		this.p.label = "Coins: " + score;
    	}
    });

    Q.scene('hud',function(stage) {
    	var container = stage.insert(new Q.UI.Container({
    		x: 60, y: 0
    	}));

    	var label = container.insert(new Q.Score());

    	container.fit(20);
    });

    Q.scene('endGame',function(stage) {
    	var box = stage.insert(new Q.UI.Container({
    		x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
    	}));

    	var button = box.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#CCCCCC",
    		label: "Play Again" }));         
    	var label = box.insert(new Q.UI.Text({x:10, y: -10 - button.p.h, 
    		label: stage.options.label }));
    	button.on("click",function() {
    		Q.audio.stop('music_main.ogg');
    		Q.clearStages();
    		Q.state.reset({coins:0});
    		Q.stageScene("title",0);
    	});
    	box.fit(20);
    });

    Q.scene('title',function(stage) {
        var box = stage.insert(new Q.UI.Container({x: Q.width/2, y: Q.height/2}));
        var button = box.insert(new Q.UI.Button({ x: 0, y: 0, asset: "mainTitle.png", keyActionName: "confirm"}));

        Q.audio.stop();
        Q.audio.play('music_main.ogg',{loop: true});

        button.on("click",function() {
            Q.clearStages();
            Q.stageScene("level1",0);
            Q.state.reset({coins: 0});
            Q.stageScene("hud",1);
        });


    });


	//LOAD ASSETS
	Q.loadTMX("levelOK.tmx, mario_small.json, mario_small.png, goomba.json, goomba.png, bloopa.json, bloopa.png, princess.png, mainTitle.png, coin.json, coin.png, music_main.mp3, music_main.ogg, coin.mp3, coin.ogg, music_die.mp3, music_die.ogg, music_level_complete.mp3, music_level_complete.ogg, stomp.mp3, stomp.ogg, music_jump.mp3, music_jump.ogg",
		function() {
			
			Q.compileSheets("mario_small.png","mario_small.json");
			Q.compileSheets("goomba.png","goomba.json");
			Q.compileSheets("bloopa.png","bloopa.json");
			Q.compileSheets("coin.png","coin.json");

			Q.animations("player", {
				marioSR: {frames: [0]},
				marioSL: {frames: [14]},
				marioR: {frames: [0,1,2], rate: 1/6, loop: false},
				marioL: {frames: [14,15,16], rate: 1/6, loop: false},
				marioJumpR: {frames: [4]},
				marioJumpL: {frames: [18]},
				marioDie: {frames: [12], rate: 1/15, next: 'marioSR'}
			});
			Q.animations("goomba", {
				waddle: {frames: [0,1], rate:1/3},
				die: {frames:[2]}
			});
			Q.animations("bloopa", {
				jump: {frames: [0]},
				die: {frames: [1]}
			});
			Q.animations("coin", {
				coin: {frames: [1,2],rate:1/3}
			});
			Q.stageScene("title",0);
		}
		);
});
