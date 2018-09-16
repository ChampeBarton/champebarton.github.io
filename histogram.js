var viewportWidth;
var viewportHeight;
var mobile = 0;

var csvContent = [];
var scriptCsv = [];
var genreSelected = "all";
var genreSelectedAll = "all";
var eraSelected = "all";
var stage = 1;
var controller;
var genreIds = {1:"action",2:"adult",3:"adventure",4:"animation",5:"biography",6:"comedy",7:"crime",8:"documentary",9:"drama",10:"family",11:"fantasy",12:"film-noir",13:"game-show",14:"history",15:"horror",16:"music",17:"musical",18:"mystery",19:"n/a",20:"news",21:"reality-tv",22:"romance",23:"sci-fi",24:"short",25:"sport",26:"thriller",27:"war",28:"western"};
var pinned = 1;

var percentFormat = d3.format(".0%");
var commaFormat = d3.format("0,000");

function drawHistogram(){

  // d3.csv("master.csv", function(error, masterData) {
    d3.csv("champebarton.github.io/genre_mapping.csv", function(error, genreMapping) {
      d3.csv("champebarton.github.io/character_list7.csv", function(error, characterData) {
        d3.csv("https://raw.githubusercontent.com/matthewfdaniels/scripts/graphs/meta_data7.csv", function(error, metaData) {
           d3.csv("champebarton.github.io/DisneyFilms3.csv", function(error, disneyFilms) {
            d3.csv("champebarton.github.io/usgross_mapping.csv", function(error, usGross) {
            //   d3.csv("lines_data.csv", function(error, lineByLine) {

    var mobileBubbleOffset = -20;
    var markerBubbleTopOffset = 34;
    var previewTopOffset = 59;

    if( /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
      viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
      mobile = 1;
      stage = 2;
      mobileBubbleOffset = 20;
      markerBubbleTopOffset = -3;
      previewTopOffset = 20;
    }

    var disneyMap = d3.map(disneyFilms,function(d){
      return d.imdb_id;
    })
    ;

    var ageNest = d3.nest()
      .key(function(d){
        return d.race;
      })
      .key(function(d) {
         return d.age;
       })
      .rollup(function(leaves) {
        var total_words = d3.sum(leaves, function(d) {
          return d.words;
        })
        return total_words;
      })
      .entries(characterData);

    var ageData = [];

    var sum = 0;

    for (var race in ageNest){
      var raceSum = 0;
      var ageValues = [];
      for (var age in ageNest[race].values){
        ageNest[race].values[age].raceTag = ageNest[race].key
        if (+ageNest[race].values[age].key > 0 && +ageNest[race].values[age].key < 110 && +ageNest[race].values[age].key != ""){
          ageValues.push(ageNest[race].values[age])
          // if(ageNest[race].key == "nw"){
          //   console.log(ageNest[race].values[age].values/4404524);
          //   sum = sum + +ageNest[race].values[age].values
          // }

          raceSum = ageNest[race].values[age].values + +raceSum;
        }
      }
      ageNest[race].values = ageValues;
      ageNest[race].total_words = raceSum;
      if(ageNest[race].key != "?"){
        ageData.push(ageNest[race]);
      }
    }

    var characterNest = d3.nest().key(function(d) {
        return d.script_id;
      })
      .entries(characterData);

    for (film in characterNest){
      var castList = characterNest[film].values;

      var offset = 0;
      castList = castList.sort(function(b, a){
        var o1 = a.race;
        var o2 = b.race;

        if (o1 < o2) return -1;
        if (o1 > o2) return 1;
        return 0;
      })
      ;
      for (castMember in castList){
        if (castMember == 0){
          castList[castMember].offset = 0
          offset = +castList[castMember].words
        }
        else{
          castList[castMember].offset = offset;
          offset = offset + +castList[castMember].words;
        }
      }
      castList = castList.sort(function(b, a){
        var o1 = +a.words;
        var o2 = +b.words;

        if (o1 > o2) return -1;
        if (o1 < o2) return 1;
        return 0;
      })
      ;
      characterNest[film].values = castList;
    }

    var characterMap = d3.map(characterNest,function(d){
        return d.key
      });

    var scriptNest = d3.nest().key(function(d) {
        return d.script_id;
      })
      .rollup(function(leaves) {
        var nonWhite_words = d3.sum(leaves, function(d) {
          if(d.race == "nw"){
            return d.words;
          }
        });
        var total_words = d3.sum(leaves, function(d) {
          return d.words;
        })

        // if(leaves[0].script_id == 3455){
          // console.log(leaves);
        // }
        if(mobile){
          var nonWhitePercent = Math.round(100*nonWhite_words/total_words)/100;
          if (nonWhitePercent*100 % 2 != 0){
            nonWhitePercent = Math.round(nonWhitePercent*100);
            if(nonWhitePercent % 2 != 0){
              nonWhitePercent = nonWhitePercent + 1;
            }
            nonWhitePercent = nonWhitePercent/100;
          }
          return {"nonWhite_percent":nonWhitePercent,"nonWhite_words":nonWhite_words,"total_words":total_words};
        }
        return {"nonWhite_percent":Math.round(100*nonWhite_words/total_words)/100, "nonWhite_words":nonWhite_words,"total_words":total_words};
      })
      .entries(characterData);

    var metaMap = d3.map(metaData,function(d){
      return d.script_id;
    })
    ;

    //get rid of the values depth
    scriptNest = scriptNest.map(function(d){
      var metaData = metaMap.get(+d.key);
      return {"lines_data":metaData.lines_data,"gross":metaData.gross,"imdb_id":metaData.imdb_id,"title":metaData.title,"year":metaData.year,"nonWhite_percent":d.values.nonWhite_percent, "nonWhite_words":d.values.nonWhite_words,"total_words":d.values.total_words,"script_id":+d.key};
    })
    ;

    var scriptMap = d3.map(scriptNest,function(d){
      return d.script_id;
    })
    ;

    var genreNest = d3.nest().key(function(d) {
        return d.imdb_id;
      })
      .entries(genreMapping);

    var genreMap = d3.map(genreNest, function(d){
      return d.key;
    });

    var values = [];
    var nonWhiteColor = "#3ecdfd" // var nonWhiteColor = "#E0451F" nonWhiteColor = "#FA0E4F"
    var whiteColor = "#fecb45" //var whiteColor = "#2161FA" #18638B var whiteColor = "#249EFB" //var whiteColor = "#2161FA"

    movieData = scriptNest;

    var formatCount = d3.format(".0%");
    var interpolateOne = d3.interpolate(whiteColor,"#ddd");
    var interpolateTwo = d3.interpolate("#ddd",nonWhiteColor);

    var colorScale = d3.scale.threshold().domain([0.1,0.4,0.6,0.9,1]).range([whiteColor,interpolateOne(0.5),"#ddd",interpolateTwo(0.5), nonWhiteColor]);
    var colorScaleTwo = d3.scale.threshold().domain([0.1,0.4,0.6,0.9,1]).range([whiteColor,interpolateOne(0.5),"#5D5A5A",interpolateTwo(0.5), nonWhiteColor]);

    var colorScaleContinuous = d3.scale.linear().domain([0,0.25,0.5,1]).range(["#fecb45","#f9d475","#ddd",nonWhiteColor]);
    var bucketScale = d3.scale.threshold().domain([0.2,0.4,0.6,0.8,1.1]).range(["bucket-a","bucket-b","bucket-c","bucket-d","bucket-e"]);

    movieData = movieData.sort(function(b, a){
      var o1 = a.nonWhite_percent;
      var o2 = b.nonWhite_percent;

      if (o1 > o2) return -1;
      if (o1 < o2) return 1;
      return 0;
    })
    ;

    var nonWhitePercentOrder = {};

    //genre-mapping
    for (item in movieData){
      var nonWhitePercentBucket = movieData[item].nonWhite_percent;
      if(nonWhitePercentBucket in nonWhitePercentOrder){
        nonWhitePercentOrder[nonWhitePercentBucket] = nonWhitePercentOrder[nonWhitePercentBucket] + 1
      }
      else{
        nonWhitePercentOrder[nonWhitePercentBucket] = 0;
      }
      movieData[item].yOrder = nonWhitePercentOrder[nonWhitePercentBucket];
      var imdbId = movieData[item].imdb_id;
      movieData[item].movie_id = +item;
      if(genreMap.has(imdbId)){
        var genreList = genreMap.get(imdbId).values;
        var genreString = "";
        for (genre in genreList){
          var genreId = genreList[genre].genre_id;
          var genreName = genreIds[genreId];
          genreString = genreString.concat(genreName + " ");
        }
        movieData[item].genreList = genreString;
      }
      else{
        movieData[item].genreList = "";
      }
      ;
    }

    function spectrumChart(){

      var width = 900;
      var rowHeight = 12;
      var smallMobile = false;
      if(mobile){
        width = viewportWidth*.92;
        rowHeight = 14;
        if (viewportWidth < 325) { smallMobile = true; };
        if(smallMobile) { width = 306 };
      }
      //
      // console.log(smallMobile);

      var randomScale = d3.scale.linear().domain([0,1]).range([0,movieData.length]);
      var spectrumData = [];

      spectrumData = movieData;

      spectrumData = spectrumData.sort(function(b, a){
        var o1 = a.nonWhite_percent;
        var o2 = b.nonWhite_percent;

        if (o1 > o2) return -1;
        if (o1 < o2) return 1;
        return 0;
      })
      ;

      var methologyText = d3.select(".methodology-one");

      var cx = d3.scale.linear().domain([0,1]).range([0,width-2]);
      var cy = d3.scale.linear().domain([0,1]).range([-20,160]).clamp(true);

      var disneyAxis = d3.select(".star-chart")
        .append("div")
        .attr("class","star-chart-disney-axis")
        ;

      var filmElements;
      var yearScale = d3.scale.linear().domain([1980,2016]).range([-20,160]).clamp(true);

      if(mobile){

        var mobileSpectrumData = spectrumData.filter(function(d,i){
          return disneyMap.has(d.imdb_id);
        })
        ;

        filmElements = d3.select(".star-chart")
          .append("div")
          .attr("class","star-chart-data")
          .selectAll("div")
          .data(mobileSpectrumData,function(d){
            return d.imdb_id;
          })
          ;

        filmElements
          .enter()
          .append("div")
          .style("width","6px")
          .style("height","0px")
          ;

      }
      else{
        filmElements = d3.select(".star-chart")
          .append("div")
          .attr("class","star-chart-data")
          .selectAll("div")
          .data(spectrumData,function(d){
            return d.imdb_id;
          })
          ;

        filmElements
          .enter()
          .append("div")
          .attr("class","film-element")
          .style("left",function(d){
            return cx(d.nonWhite_percent) + "px";
          })
          .style("top",function(d,i){
            return d.yOrder*7 - 20 + "px";
          })
          .style("background-color",function(d){
            // return "rgb(255,255,255)"
            var color = d3.rgb(colorScaleContinuous(d.nonWhite_percent));
            return color;
          })
          .style("width","6px")
          .style("height","0px")
          .style("visibility","hidden")
          .on("mouseover",function(d,i){
            var data = d,
                order = i,
                element = this;
            elementMouseover(element,data,order);
          })
          .on("mouseout",function(d,i){
            var data = d,
                order = i,
                element = this;
            elementMouseout(element,data,order);
          })
          .on("click",function(d,i){
            var data = d,
                order = i,
                element = this;
            elementClick(element,data,order);
          })
          .on("touchstart",function(d,i){
            var data = d,
                order = i,
                element = this;
            elementTouchstart(element,data,order);
          })
          ;

      }

      var leftAssign = d3.scale.threshold().domain([.4,.6,1]).range([1,2,3]);
      var disneyScalenonWhite = d3.scale.linear().domain([0,1]).range(["#CCC",nonWhiteColor]);
      var disneyScalewhite = d3.scale.linear().domain([0,1]).range(["#CCC",whiteColor]);

      var disneyElements = filmElements
        .filter(function(d,i){
          return disneyMap.has(d.imdb_id);
        })
        .attr("id","disney-cell")
        // .style("background-color","red")
        .style("width",function(d,i){
          if(mobile){
            return width + "px";
          }
          return width/3 + 10 + "px";
        })
        .style("z-index",1000)
        .style("visibility","visible")
        ;

      var bucketElements = [1,2,3];

      for (bucket in bucketElements){

        if(mobile == 1 && bucket == 0){
          var disneyElementsData = disneyElements
            .filter(function(d,i){
              if(mobile){
                return d;
              }
              return leftAssign(d.nonWhite_percent) == bucketElements[bucket];
            })
            .style("left",function(d){
              if(mobile){
                return null;
              }
              return width*((leftAssign(d.nonWhite_percent)-1)/3) + 10 + "px";
            })
            .style("top",function(d,i){
              return i*rowHeight - 10 + "px"
            })
            .append("div")
            .attr("class","film-element-data")
            ;

          rowText = disneyElementsData.append("p")
            .attr("class","film-element-text tk-futura-pt")
            .text(function(d){
              if(d.title.length > 25){
                return d.title.slice(0,22)+"...";
              }
              if(smallMobile){
                if(d.title.length > 15){
                  return d.title.slice(0,12)+"...";
                }
              }
              return d.title;
            })
            ;

          var barContainer = disneyElementsData.append("div")
            .attr("class","film-element-column-container tk-futura-pt")
            ;

          var whiteBar = barContainer.append("div")
            .attr("class","film-white-bar film-bar")
            .style("background-color", function(d){
              return disneyScalewhite(1-d.nonWhite_percent);
            })
            .style("width", function(d){
              return 100*(1-d.nonWhite_percent) + "%";
            })
            ;

          var nonWhiteBar = barContainer.append("div")
            .attr("class","film-nonwhite-bar film-bar")
            .style("background-color", function(d){
              return disneyScalenonWhite(d.nonWhite_percent);
            })
            ;

          var statContainer = disneyElementsData.append("div")
            .attr("class","film-stat-container tk-futura-pt")
            ;

          statContainer.append("div")
            .attr("class","film-nonWhite-stat tk-futura-pt")
            .style("color",function(d){
              if (d.nonWhite_percent < 0.333333){
                return whiteColor;
              }
              else if (d.nonWhite_percent > 0.666665){
                return nonWhiteColor;
              }
            })
            .html(function(d,i){
              if (i==0 && d.nonWhite_percent < .33){
                return percentFormat(1-d.nonWhite_percent) + " white Dialogue"
              }
              else if (i==0 && d.nonWhite_percent > .6666665){
                return percentFormat(d.nonWhite_percent) + " nonwhite Dialogue"
              }
              else if (i % 5 == 0 && d.nonWhite_percent < .33){
                return percentFormat(1-d.nonWhite_percent)
              }
              else if (i % 5 == 0 && d.nonWhite_percent > .66666665){
                return percentFormat(d.nonWhite_percent)
              }
              else if (i % 5 == 0){
                return "<span class='white-color'>" + percentFormat(1-d.nonWhite_percent) + "</span>/<span class='nonwhite-color'>" + percentFormat(d.nonWhite_percent) + "</span>"
              }
              return null;
            })
            .style("line-height",function(d,i){
              if (i==0 && (d.nonWhite_percent < .33 || d.nonWhite_percent > .6666665)){
                return "10px";
              }
              return null;
            })
            ;

          var disneyAxisBucket = disneyAxis.append("div")
            .attr("class","star-chart-disney-axis-bucket")
            .style("left",function(d){
              return width*((bucketElements[bucket])-1)/3 + 10 + "px";
            })
            .style("width",width/3 - 20 + "px")
            ;

          disneyAxisBucket.append("div")
            .attr("class","disney-mid-line")
            .style("height",function(d){
              return disneyElementsData.size()*14.1+"px";
            })
            ;

          disneyAxisBucket.append("div")
            .attr("class","disney-mid-line-label tk-futura-pt")
            .text("50/50")
            ;

          disneyAxisBucket.append("div")
            .attr("class","disney-bucket-border tk-futura-pt")
            ;

          disneyAxisBucket.append("div")
            .attr("class","disney-bucket-label tk-futura-pt")
            .style("color",function(d){
              if(bucketElements[bucket] == 1){
                return whiteColor;
              }
              else if (bucketElements[bucket] == 2){
                return "#000";
              }
              return nonWhiteColor;
            })
            .text(function(d){
              if(bucketElements[bucket] == 1){
                return "Whites have 60%+ Dialogue"
              }
              else if (bucketElements[bucket] == 2){
                return "Race Balance, +/- 10%"
              }
              return "Nonwhites have 60%+ Dialogue"
            })
            ;
        }

        if(!mobile){
          var disneyElementsData = disneyElements
            .filter(function(d,i){
              return leftAssign(d.nonWhite_percent) == bucketElements[bucket];
            })
            .style("left",function(d){
              return width*((leftAssign(d.nonWhite_percent)-1)/3) + 10 + "px";
            })
            .style("top",function(d,i){
              return i*rowHeight - 10 + "px"
            })
            .append("div")
            .attr("class","film-element-data")
            ;

          rowText = disneyElementsData.append("p")
            .attr("class","film-element-text tk-futura-pt")
            .text(function(d){
              if(d.title.length > 25){
                return d.title.slice(0,22)+"...";
              }
              return d.title;
            })
            ;

          var barContainer = disneyElementsData.append("div")
            .attr("class","film-element-column-container tk-futura-pt")
            ;

          var whiteBar = barContainer.append("div")
            .attr("class","film-white-bar film-bar")
            .style("background-color", function(d){
              return disneyScalewhite(1-d.nonWhite_percent);
            })
            .style("width", function(d){
              return 100*(1-d.nonWhite_percent) + "%";
            })
            ;

          var nonWhiteBar = barContainer.append("div")
            .attr("class","film-nonwhite-bar film-bar")
            .style("background-color", function(d){
              return disneyScalenonWhite(d.nonWhite_percent);
            })
            .style("width", function(d){
              return 100*(d.nonWhite_percent) + "%";
            })
            ;

          var statContainer = disneyElementsData.append("div")
            .attr("class","film-stat-container tk-futura-pt")
            ;

          statContainer.append("div")
            .attr("class","film-nonWhite-stat tk-futura-pt")
            .style("color",function(d){
              if (d.nonWhite_percent < 0.333333){
                return whiteColor;
              }
              else if (d.nonWhite_percent > 0.666665){
                return nonWhiteColor;
              }
            })
            .html(function(d,i){
              if (i==0 && d.nonWhite_percent < .33){
                return percentFormat(1-d.nonWhite_percent) + " white Dialogue"
              }
              else if (i==0 && d.nonWhite_percent > .6666665){
                return percentFormat(d.nonWhite_percent) + " nonWhite Dialogue"
              }
              else if (i % 5 == 0 && d.nonWhite_percent < .33){
                return percentFormat(1-d.nonWhite_percent)
              }
              else if (i % 5 == 0 && d.nonWhite_percent > .66666665){
                return percentFormat(d.nonWhite_percent)
              }
              else if (i % 5 == 0){
                return "<span class='white-color'>" + percentFormat(1-d.nonWhite_percent) + "</span>/<span class='nonwhite-color'>" + percentFormat(d.nonWhite_percent) + "</span>"
              }
              return null;
            })
            .style("line-height",function(d,i){
              if (i==0 && (d.nonWhite_percent < .33 || d.nonWhite_percent > .6666665)){
                return "10px";
              }
              return null;
            })
            ;

          var disneyAxisBucket = disneyAxis.append("div")
            .attr("class","star-chart-disney-axis-bucket")
            .style("left",function(d){
              return width*((bucketElements[bucket])-1)/3 + 10 + "px";
            })
            .style("width",width/3 - 20 + "px")
            ;

          disneyAxisBucket.append("div")
            .attr("class","disney-mid-line")
            .style("height",function(d){
              return disneyElementsData.size()*12+"px";
            })
            ;

          disneyAxisBucket.append("div")
            .attr("class","disney-mid-line-label tk-futura-pt")
            .text("50/50")
            ;

          disneyAxisBucket.append("div")
            .attr("class","disney-bucket-border tk-futura-pt")
            ;

          disneyAxisBucket.append("div")
            .attr("class","disney-bucket-label tk-futura-pt")
            .style("color",function(d){
              if(bucketElements[bucket] == 1){
                return whiteColor;
              }
              else if (bucketElements[bucket] == 2){
                return "#000";
              }
              return nonWhiteColor;
            })
            .text(function(d){
              if(bucketElements[bucket] == 1){
                return "Whites have 60%+ Dialogue"
              }
              else if (bucketElements[bucket] == 2){
                return "Race Balance, +/- 10%"
              }
              return "Nonwhites have 60%+ Dialogue"
            })
            ;
        }

      }
      if(!mobile){
        controller = new ScrollMagic.Controller();
      }

      d3.selectAll(".histogram-two-big").on("click",function(){
        var stageId = d3.select(this).attr("id");

        d3.selectAll(".histogram-two-big").style("color",null).style("fill",null).style("font-weight",null);
        d3.select(this)
          .style("color","#000")
          .style("font-weight","600")
          .style("fill","#000")
          ;

        if (stageId == "stage-two"){
          stage = 2;
          stageTwo();
        }
        else if (stageId == "stage-one"){
          stage = 1;
          stageOne();
        }
        else if (stageId == "stage-three"){
          stage = 3;
          stageThree();
        }
      })
      ;

      function stageOne(){

        d3.select(".filters").style("visibility","hidden");
        disneyAxis.style("visibility","visible").style("opacity",0).transition().duration(500).style("opacity",1);
        histogramTwoAxis.style("opacity",1).transition().duration(500).style("opacity",0).transition().duration(0).style("opacity",null).style("visibility","hidden");
        d3.select(".histogram-two-script-container").style("visibility","hidden");
        markerBubble.transition().duration(100).style("opacity",0);
        previewNameContainer.style("display","none");
        methologyText.transition().duration(0).style("display","none");

        filmElements = filmElements.data(spectrumData,function(d){
          return d.imdb_id;
        })
        ;

        var disneyExisting = filmElements
          .filter(function(d,i){
            return d3.select(this).attr("id") == "disney-cell";
          })
          ;

        var disneyMissingElements = filmElements
          .filter(function(d,i){
            return disneyMap.has(d.imdb_id) && d3.select(this).attr("id") != "disney-cell";
          })
          .attr("id","disney-cell")
          .style("width",width/3 + 10 + "px")
          .style("z-index",1000)
          .style("height","0px")
          .style("visibility","visible")
          ;


        var bucketElements = [1,2,3];

        for (bucket in bucketElements){

          var disneyElementsMove = disneyMissingElements
            .filter(function(d,i){
              return leftAssign(d.nonWhite_percent) == bucketElements[bucket];
            })
            .sort(function(a, b){
              return d3.ascending(+a.nonWhite_percent, +b.nonWhite_percent);
            })
            ;

          var disneyElementsData = disneyElementsMove
            .append("div")
            .attr("class","film-element-data")
            ;

          rowText = disneyElementsData.append("p")
            .attr("class","film-element-text tk-futura-pt")
            .text(function(d){
              if(d.title.length > 25){
                return d.title.slice(0,22)+"...";
              }
              return d.title;
            })
            ;

          var barContainer = disneyElementsData.append("div")
            .attr("class","film-element-column-container tk-futura-pt")
            ;

          var whiteBar = barContainer.append("div")
            .attr("class","film-white-bar film-bar")
            .style("background-color", function(d){
              return disneyScalewhite(1-d.nonWhite_percent);
            })
            .style("width", function(d){
              return 100*(1-d.nonWhite_percent) + "%";
            })
            ;

          var nonWhiteBar = barContainer.append("div")
            .attr("class","film-nonwhite-bar film-bar")
            .style("background-color", function(d){
              return disneyScalenonWhite(d.nonWhite_percent);
            })
            ;

          var statContainer = disneyElementsData.append("div")
            .attr("class","film-stat-container tk-futura-pt")
            ;

          statContainer.append("div")
            .attr("class","film-nonWhite-stat tk-futura-pt")
            .style("color",function(d){
              if (d.nonWhite_percent < 0.333333){
                return whiteColor;
              }
              else if (d.nonWhite_percent > 0.666665){
                return nonWhiteColor;
              }
            })
            .html(function(d,i){
              if (i==0 && d.nonWhite_percent < .33){
                return percentFormat(1-d.nonWhite_percent) + " white Dialogue"
              }
              else if (i==0 && d.nonWhite_percent > .6666665){
                return percentFormat(d.nonWhite_percent) + " nonWhite Dialogue"
              }
              else if (i % 5 == 0 && d.nonWhite_percent < .33){
                return percentFormat(1-d.nonWhite_percent)
              }
              else if (i % 5 == 0 && d.nonWhite_percent > .66666665){
                return percentFormat(d.nonWhite_percent)
              }
              else if (i % 5 == 0){
                return "<span class='white-color'>" + percentFormat(1-d.nonWhite_percent) + "</span>/<span class='nonwhite-color'>" + percentFormat(d.nonWhite_percent) + "</span>"
              }
              return null;
            })
            .style("line-height",function(d,i){
              if (i==0 && (d.nonWhite_percent < .33 || d.nonWhite_percent > .6666665)){
                return "10px";
              }
              return null;
            })
            ;

        }

        filmElements.exit().remove();

        var filmElementsNew = filmElements
          .enter()
          .append("div")
          .attr("class",function(d,i){
            return "film-element" + " " + d.title;
          })
          .style("background-color",function(d){
            var color = d3.rgb(colorScaleContinuous(d.nonWhite_percent));
            return color;
          })
          .style("left",function(d){
            return cx(d.nonWhite_percent) + "px";
          })
          .style("top",function(d,i){
            return d.yOrder*7 - 20 + "px";
          })
          .style("width","6px")
          .style("height","0px")
          .style("visibility","hidden")
          .on("mouseover",function(d,i){
            var data = d,
                order = i,
                element = this;
            elementMouseover(element,data,order);
          })
          .on("mouseout",function(d,i){
            var data = d,
                order = i,
                element = this;
            elementMouseout(element,data,order);
          })
          .on("click",function(d,i){
            var data = d,
                order = i,
                element = this;
            elementClick(element,data,order);
          })
          .on("touchstart",function(d,i){
            var data = d,
                order = i,
                element = this;
            elementTouchstart(element,data,order);
          })
          ;

        filmElements
          .filter(function(d,i){
            var disney = disneyMap.has(d.imdb_id);
            return disney == false;
          })
          .transition()
          .duration(0)
          .style("left",function(d){
            return cx(d.nonWhite_percent) + "px";
          })
          .style("top",function(d,i){
            return d.yOrder*7 - 20 + "px";
          })
          .style("width","6px")
          .style("height","0px")
          .style("visibility","hidden")
          ;

        disneyExisting
          .transition()
          .duration(0)
          .style("visibility","visible")
          .select("div")
          .style("visibility","visible")
          .select("p")
          .style("color",null)
          .style("width",null)
          ;

        var disneyElements = filmElementsNew
          .filter(function(d,i){
            return disneyMap.has(d.imdb_id);
          })
          .attr("id","disney-cell")
          // .style("background-color","red")
          .style("width",width/3 + 10 + "px")
          .style("z-index",1000)
          .style("visibility","visible")
          ;

        for (bucket in bucketElements){

          var disneyElementsMove = disneyElements
            .filter(function(d,i){
              return leftAssign(d.nonWhite_percent) == bucketElements[bucket];
            })
            .sort(function(a, b){
              return d3.ascending(+a.nonWhite_percent, +b.nonWhite_percent);
            })
            ;

          disneyElementsMove
            .transition()
            .duration(0)
            .style("left",function(d){
              return width*((leftAssign(d.nonWhite_percent)-1)/3) + 10 + "px";
            })
            .style("top",function(d,i){
              return i*12 - 10 + "px"
            })
            .style("height","0px")
            ;

          var disneyElementsData = disneyElementsMove
            .append("div")
            .attr("class","film-element-data")
            ;

          rowText = disneyElementsData.append("p")
            .attr("class","film-element-text tk-futura-pt")
            .text(function(d){
              if(d.title.length > 25){
                return d.title.slice(0,22)+"...";
              }
              return d.title;
            })
            ;

          var barContainer = disneyElementsData.append("div")
            .attr("class","film-element-column-container tk-futura-pt")
            ;

          var whiteBar = barContainer.append("div")
            .attr("class","film-white-bar film-bar")
            .style("background-color", function(d){
              return disneyScalewhite(1-d.nonWhite_percent);
            })
            .style("width", function(d){
              return 100*(1-d.nonWhite_percent) + "%";
            })
            ;

          var nonWhiteBar = barContainer.append("div")
            .attr("class","film-nonwhite-bar film-bar")
            .style("background-color", function(d){
              return disneyScalenonWhite(d.nonWhite_percent);
            })
            ;

          var statContainer = disneyElementsData.append("div")
            .attr("class","film-stat-container tk-futura-pt")
            ;

          statContainer.append("div")
            .attr("class","film-nonWhite-stat tk-futura-pt")
            .style("color",function(d){
              if (d.nonWhite_percent < 0.333333){
                return whiteColor;
              }
              else if (d.nonWhite_percent > 0.666665){
                return nonWhiteColor;
              }
            })
            .html(function(d,i){
              if (i==0 && d.nonWhite_percent < .33){
                return percentFormat(1-d.nonWhite_percent) + " white Dialogue"
              }
              else if (i==0 && d.nonWhite_percent > .6666665){
                return percentFormat(d.nonWhite_percent) + " nonWhite Dialogue"
              }
              else if (i % 5 == 0 && d.nonWhite_percent < .33){
                return percentFormat(1-d.nonWhite_percent)
              }
              else if (i % 5 == 0 && d.nonWhite_percent > .66666665){
                return percentFormat(d.nonWhite_percent)
              }
              else if (i % 5 == 0){
                return "<span class='white-color'>" + percentFormat(1-d.nonWhite_percent) + "</span>/<span class='nonwhite-color'>" + percentFormat(d.nonWhite_percent) + "</span>"
              }
              return null;
            })
            .style("line-height",function(d,i){
              if (i==0 && (d.nonWhite_percent < .33 || d.nonWhite_percent > .6666665)){
                return "10px";
              }
              return null;
            })
            ;

        }

        for (bucket in bucketElements){

          var disneyElementsMove = d3.selectAll("#disney-cell")
            .filter(function(d,i){
              return leftAssign(d.nonWhite_percent) == bucketElements[bucket];
            })
            .sort(function(a, b){
              return d3.ascending(+a.nonWhite_percent, +b.nonWhite_percent);
            })
            ;

          disneyElementsMove
            .transition()
            .duration(0)
            .style("left",function(d){
              return width*((leftAssign(d.nonWhite_percent)-1)/3) + 10 + "px";
            })
            .style("top",function(d,i){
              return i*12 - 10 + "px"
            })
            .style("width",width/3 + 10 + "px")
            .style("height","0px")
            ;

        }


      }

      function stageTwo(){
        d3.select(".filters").style("visibility","visible");
        if(!mobile){
          d3.selectAll("#disney-cell").select("div").select("p").style("color","rgba(0,0,0,0)").style("width","0px");
          disneyAxis.style("visibility","hidden");
          d3.select(".histogram-two-script-container").style("visibility","hidden");
        }

        histogramTwoAxis.style("opacity",0).style("visibility","visible").transition().duration(500).style("opacity",1).transition().duration(0).style("opacity",null);
        if(!mobile){
          markerBubble.transition().duration(0).style("opacity",0);
          previewNameContainer.transition().duration(0).style("display","none");
        }
        methologyText.transition().duration(0).style("display","none");

        var filteredSpectrumData = spectrumData.filter(function(d,i){
          var string = d.genreList;
          if(genreSelected=="all"){
            return d;
          }
          var substring = genreSelected;
          return string.indexOf(substring) > -1
        })
        ;

        var nonWhitePercentOrder = {};

        //genre-mapping
        for (item in filteredSpectrumData){
          var nonWhitePercentBucket = filteredSpectrumData[item].nonWhite_percent;
          if(nonWhitePercentBucket in nonWhitePercentOrder){
            nonWhitePercentOrder[nonWhitePercentBucket] = nonWhitePercentOrder[nonWhitePercentBucket] + 1
          }
          else{
            nonWhitePercentOrder[nonWhitePercentBucket] = 0;
          }
          filteredSpectrumData[item].yOrder = nonWhitePercentOrder[nonWhitePercentBucket];
          ;
        }

        filmElements = filmElements.data(filteredSpectrumData,function(d){
            return d.imdb_id;
        })
        ;

        filmElements.exit().remove();

        var filmElementsNew = filmElements
          .enter()
          .append("div")
          .style("top",function(d,i){
            return d.yOrder*7 + mobileBubbleOffset + "px";
          })
          .style("left",function(d){
            if(mobile){
              return Math.round(cx(d.nonWhite_percent)) + "px";
            }
            return cx(d.nonWhite_percent) + "px";
          })
          .attr("class","film-element")
          .style("background-color",function(d){
            var color = d3.rgb(colorScaleContinuous(d.nonWhite_percent));
            return color;
            // return "#fff";
          })
          .on("mouseover",function(d,i){
            var data = d,
                order = i,
                element = this;
            elementMouseover(element,data,order);
          })
          .on("mouseout",function(d,i){
            var data = d,
                order = i,
                element = this;
            elementMouseout(element,data,order);
          })
          .on("click",function(d,i){
            var data = d,
                order = i,
                element = this;
            elementClick(element,data,order);
          })
          .on("touchstart",function(d,i){
            var data = d,
                order = i,
                element = this;
            elementTouchstart(element,data,order);
          })
          ;


        if(!mobile){
          d3.selectAll("#disney-cell")
            .style("width","6px")
            .style("height","6px")
            .style("background-color",function(d){
              var color = d3.rgb(colorScaleContinuous(d.nonWhite_percent));
              return color;
            })
            .style("left",function(d){
              return cx(d.nonWhite_percent) + "px";
            })
            .select("div")
            .style("visibility","hidden")
            ;
        }

        filmElements
          .style("visibility","visible")
          .transition()
          .duration(500)
          .style("left",function(d){
            if(mobile){
              return Math.floor(cx(d.nonWhite_percent)) + "px";
            }
            return cx(d.nonWhite_percent) + "px";
          })
          .style("top",function(d,i){
            return d.yOrder*7 + mobileBubbleOffset + "px";
          })
          .style("width",function(){
            if(mobile){
              return "5px";
            }
            return "6px";
          })
          .style("height",function(){
            if(mobile){
              return "5px";
            }
            return "6px";
          })
          ;

        markerFixed.transition().duration(0).style("opacity",null).style("display",null);
        previewNameContainerFixed.transition().duration(0).style("opacity",null).style("display",null);

        var delayAmount = 200;
        var durationAmount = 1500;

        var axisWidth = 900;
        if(mobile){
          axisWidth = width;
          // console.log(axisWidth);
        }

        nonWhiteTop.transition().duration(durationAmount).delay(delayAmount).style("opacity",1).style("left",axisWidth - 1 +"px");
        whiteTop.transition().duration(durationAmount).delay(delayAmount).style("opacity",1);
        if(mobile){
          whiteForty.style("opacity",0);
          nonWhiteSixty.style("opacity",0);
          whiteTen.style("opacity",0);
        }else{
          whiteForty.transition().duration(durationAmount).delay(delayAmount).style("opacity",).style("left",axisWidth*(0.4)+"px");
          nonWhiteSixty.transition().duration(durationAmount).delay(delayAmount).style("opacity",1).style("left",axisWidth*(0.6)+"px");
          whiteTen.transition().duration(durationAmount).delay(delayAmount).style("opacity",1).style("left",axisWidth*(0.1)+"px");
        }
        whiteTwentyFive.transition().duration(durationAmount).delay(delayAmount).style("opacity",1).style("left",axisWidth*(0.25)+"px");
        midPoint.transition().duration(durationAmount).delay(delayAmount).style("left",axisWidth*(0.5)+"px");
      }

      function stageThree(){
        markerBubble.transition().duration(0).style("opacity",0);
        previewNameContainer.transition().duration(0).style("display","none");
        d3.select(".filters").style("visibility","visible");
        d3.selectAll("#disney-cell").select("div").style("visibility","hidden");
        disneyAxis.transition().duration(500).style("opacity",0).transition().duration(0).style("visibility","hidden").style("opacity",null);
        histogramTwoAxis.style("opacity",0).style("visibility","visible").transition().duration(500).style("opacity",1).transition().duration(0).style("opacity",null);
        // d3.select(".histogram-two-y-axis").style("visibility","hidden");
        d3.select(".histogram-two-script-container").style("opacity",0).style("visibility","visible").transition().duration(1000).delay(1000).style("opacity",1).transition().duration(0).delay(2000).style("opacity",null);
        markerFixed.transition().duration(0).style("display","block");
        previewNameContainerFixed.transition().duration(0).style("display","block");
        d3.select(".search-results").style("display","none");
        methologyText.transition().duration(0).delay(1500).style("display","block");

        var filteredSpectrumData = spectrumData.filter(function(d,i){
          var string = d.genreList;
          if(genreSelected=="all"){
            return +d.gross > 45;
          }
          var substring = genreSelected;
          return string.indexOf(substring) > -1 && +d.gross > 45;
        })
        ;

        filmElements = filmElements.data(filteredSpectrumData,function(d){
          return d.imdb_id;
        })
        ;

        filmElements
          .exit()
          .transition()
          .duration(300)
          .style("opacity",0)
          .remove()
          ;

        var filmElementsNew = filmElements
          .enter()
          .append("div")
          .attr("class","film-element")
          .style("background-color",function(d){
            var color = d3.rgb(colorScaleContinuous(d.nonWhite_percent));
            return color;
            // return "#fff";
          })
          .on("mouseover",function(d,i){
            var data = d,
                order = i,
                element = this;
            elementMouseover(element,data,order);
          })
          .on("mouseout",function(d,i){
            var data = d,
                order = i,
                element = this;
            elementMouseout(element,data,order);
          })
          .on("click",function(d,i){
            var data = d,
                order = i,
                element = this;
            elementClick(element,data,order);
          })
          .on("touchstart",function(d,i){
            var data = d,
                order = i,
                element = this;
            elementTouchstart(element,data,order);
          })
          ;


        filmElements
          .style("visibility","visible")
          .style("pointer-events","all")
          .transition()
          .duration(600)
          .style("width",function(d){
            return "1px";
          })
          .style("height",function(d){
            return "40px";
          })
          .transition()
          .duration(600)
          .delay(function(d,i){
            return 500+i;
          })
          .style("left",function(d,i){
            return i+"px";
          })
          .style("top",function(d){
            // return cy(Math.random());
            return "-20px";
          })
          .style("background-color",function(d){
            var color = d3.rgb(colorScaleContinuous(d.nonWhite_percent));
            return color;
            // return "#fff";
          })
          ;

        disneyElements
          .style("background-color",function(d){
            return "#fff"
          })
          .style("pointer-events","all")
          .style("width","6px")
          .style("height","6px")
          .style("background-color",function(d){
            var color = d3.rgb(colorScaleContinuous(d.nonWhite_percent));
            return color;
          })
          .style("left",function(d){
            return cx(d.nonWhite_percent) + "px";
          })
          .select("div")
          .style("visibility","hidden")
          ;

        filmElements.order();
        adjustAxis(genreSelected);
      }

      if(!mobile){

      var pinFirstChart = new ScrollMagic.Scene({triggerElement: ".pin-trigger",triggerHook:0, offset:30,duration:1500})
        // .addIndicators({name: "pin first chart"}) // add indicators (requires plugin)
        .setPin(".star-chart-container", {pushFollowers: false})
        .addTo(controller)
        ;

      var exitOnTop1000 = new ScrollMagic.Scene({triggerElement: ".star-chart-container",duration:200,triggerHook:0, offset:200})
          // .addIndicators({name: "expand"}) // add indicators (requires plugin)
          .addTo(controller)
          .on("enter", function (e) {
            if(e.target.controller().info("scrollDirection") == "FORWARD"){

              if(stage == 1){
                disneyAxis.style("visibility","hidden");
                histogramTwoAxis.style("opacity",0).style("visibility","visible").transition().duration(500).style("opacity",1).transition().duration(0).style("opacity",null);
                d3.select(".histogram-two-script-container").style("visibility","hidden");

                var findingNemo = spectrumData.filter(function(d,i){
                  return d.imdb_id == "tt0266543";
                })[0]
                ;


                d3.selectAll("#disney-cell")
                  .transition()
                  .duration(500)
                  // .delay(500)
                  .select("div")
                  .style("opacity",0)
                  .transition()
                  .duration(0)
                  .style("opacity",null)
                  .style("visibility","hidden")
                  ;

                d3.selectAll("#disney-cell")
                  .style("height","6px")
                  .transition()
                  .duration(500)
                  .style("width","6px")
                  .transition()
                  .duration(500)
                  .style("left",function(d){
                    return Math.floor(cx(d.nonWhite_percent)) + "px";
                  })
                  .style("top",function(d){
                    return "0px";
                  })
                  ;

                markerBubble
                  .style("top","34px")
                  .style("left",function(d){
                    return Math.floor(cx(findingNemo.nonWhite_percent)) -3 + "px";
                  })
                  .transition()
                  .duration(300)
                  .delay(1000)
                  .style("opacity",1)
                  ;

                previewName.text(findingNemo.title);
                previewData.data([findingNemo.nonWhite_percent,1-findingNemo.nonWhite_percent]).enter();

                previewData.select(".histogram-two-data-preview-percent")
                  .text(function(d,i){
                    return percentFormat(d);
                  });

                previewData.select(".histogram-two-data-preview-bar")
                  .transition()
                  .duration(200)
                  .style("width",function(d){
                    return previewDataBarScale(d) + "px";
                  });


                previewNameContainer
                  .style("top","54px")
                  .style("left","151px")
                  .transition()
                  .duration(0)
                  .delay(800)
                  .style("display","block")
                  ;

                markerFixed.transition().duration(0).style("opacity",null).style("display",null);
                previewNameContainerFixed.transition().duration(0).style("opacity",null).style("display",null);

                var delayAmount = 200;
                var durationAmount = 1500;

                nonWhiteTop.transition().duration(durationAmount).delay(delayAmount).style("opacity",1).style("left",900 - 1 +"px");
                whiteTop.transition().duration(durationAmount).delay(delayAmount).style("opacity",1);
                whiteForty.transition().duration(durationAmount).delay(delayAmount).style("opacity",1).style("left",900*(0.4)+"px");
                whiteTen.transition().duration(durationAmount).delay(delayAmount).style("opacity",1).style("left",900*(0.1)+"px");
                whiteTwentyFive.transition().duration(durationAmount).delay(delayAmount).style("opacity",1).style("left",900*(0.25)+"px");
                nonWhiteSixty.transition().duration(durationAmount).delay(delayAmount).style("opacity",1).style("left",900*(0.6)+"px");
                midPoint.transition().duration(durationAmount).delay(delayAmount).style("left",900*(0.5)+"px");
              }

            }
            else{
            }
          })
          .on("leave", function(e){
            if(e.target.controller().info("scrollDirection") == "FORWARD"){
                stage = 2;
                stageTwo();

                d3.selectAll(".histogram-two-big").style("color",null).style("fill",null).style("font-weight",null);
                d3.select("#stage-two")
                  .style("color","#000")
                  .style("font-weight","600")
                  .style("fill","#000")
                  ;
            }
            else{


                stage = 1;
                stageOne();

                d3.selectAll(".histogram-two-big").style("color",null).style("fill",null).style("font-weight",null);
                d3.select("#stage-one")
                  .style("color","#000")
                  .style("font-weight","600")
                  .style("fill","#000")
                  ;
            }
          })
          ;

      var exitOnTop1000 = new ScrollMagic.Scene({triggerElement: ".star-chart-container",duration:500,triggerHook:0, offset:900})
          // .addIndicators({name: "stage 3"}) // add indicators (requires plugin)
          .addTo(controller)
          .on("enter", function (e) {
            if(e.target.controller().info("scrollDirection") == "FORWARD"){
              stage = 3;
              stageThree();

              d3.selectAll(".histogram-two-big").style("color",null).style("fill",null).style("font-weight",null);
              d3.select("#stage-three")
                .style("color","#000")
                .style("font-weight","600")
                .style("fill","#000")
                ;
            }
          })
          ;

      }

      function updateSpectrumSearch(data){

        var filteredSpectrumData = spectrumData.filter(function(d,i){
          var string = d.genreList;
          if(genreSelected == "all" && stage == 3){
            return +d.gross > 45;
          }
          else if(genreSelected =="all" && stage == 2){
            return d;
          }
          else if(stage == 3){
            var substring = genreSelected;
            return +d.gross > 45 && string.indexOf(substring) > -1;
          }
          var substring = genreSelected;
          return string.indexOf(substring) > -1
        })
        ;

        var nonWhitePercentOrder = {};

        //genre-mapping
        for (item in filteredSpectrumData){
          var nonWhitePercentBucket = filteredSpectrumData[item].nonWhite_percent;
          if(nonWhitePercentBucket in nonWhitePercentOrder){
            nonWhitePercentOrder[nonWhitePercentBucket] = nonWhitePercentOrder[nonWhitePercentBucket] + 1
          }
          else{
            nonWhitePercentOrder[nonWhitePercentBucket] = 0;
          }
          filteredSpectrumData[item].yOrder = nonWhitePercentOrder[nonWhitePercentBucket];
          ;
        }

        filmElements = filmElements.data(filteredSpectrumData,function(d){
          return d.imdb_id;
        })
        ;

        filmElements
          .exit()
          .style("background-color",function(d){
            if(stage == 2){
              return "rgba(0, 222, 170, 0.56)";
            }
            return d3.rgb(colorScaleContinuous(d.nonWhite_percent));
          })
          .transition()
          .duration(500)
          .delay(function(d,i){
            return i*Math.random()/2;
          })
          .style("opacity",0)
          .remove()
          ;

        filmElements
          .style("background-color",function(d){
            var color = d3.rgb(colorScaleContinuous(d.nonWhite_percent));
            return color;
          })
          .style("left",function(d,i){
            if (stage == 2){
              if(mobile){
                return Math.floor(cx(d.nonWhite_percent)) + "px";
              }
              return cx(d.nonWhite_percent) + "px";
            }
            return i+"px";
          })
          .transition()
          .duration(500)
          .delay(function(d,i){
            if(stage == 2){
              return i*Math.random()/2 + 900;
            }
            return i*Math.random()/2;
          })
          .style("top",function(d,i){
            if (stage == 2){
              return d.yOrder*7 + mobileBubbleOffset + "px";
            }
            return "-20px";
          })
          .style("width",function(d){
            if (stage == 2){
              if(mobile){
                return "5px";
              }
              return "6px";
            }
            return "1px"
          })
          .style("height",function(d){
            if (stage == 2){
              if(mobile){
                return "5px";
              }
              return "6px";
            }
            return "40px"
          })
          ;

        filmElements
          .enter()
          .append("div")
          .attr("class","film-element")
          .style("background-color",function(d){
            if(stage==2){
              return "rgba(0,0,0,0)";
              // var color = d3.rgb(colorScaleContinuous(d.nonWhite_percent));
              // return color;
            }
            return "#fff";
          })
          .style("width",function(d){
            if (stage == 2){
              if(mobile){
                return "5px";
              }
              return "6px";
            }
            return "1px"
          })
          .style("height",function(d){
            if (stage == 2){
              if(mobile){
                return "5px";
              }
              return "6px";
            }
            return "40px"
          })
          .style("top",function(d,i){
            if (stage == 2){
              return d.yOrder*7 + mobileBubbleOffset + "px";
            }
            return "-20px";
          })
          .style("left",function(d,i){
            if (stage == 2){
              if(mobile){
                return Math.floor(cx(d.nonWhite_percent)) + "px";
              }
              return cx(d.nonWhite_percent) + "px";
            }
            return i+"px";
          })
          .on("mouseover",function(d,i){
            var data = d,
                order = i,
                element = this;
            elementMouseover(element,data,order);
          })
          .on("mouseout",function(d,i){
            var data = d,
                order = i,
                element = this;
            elementMouseout(element,data,order);
          })
          .on("click",function(d,i){
            var data = d,
                order = i,
                element = this;
            elementClick(element,data,order);
          })
          .on("touchstart",function(d,i){
            var data = d,
                order = i,
                element = this;
            elementTouchstart(element,data,order);
          })
          .transition()
          .duration(function(){
            if(stage==2){
              return 0
            }
            return 300;
          })
          .delay(function(d,i){
            if(stage == 2){
              return i*Math.random();
            }
            return 500;
          })
          .style("background-color",function(d){
            var color = d3.rgb(colorScaleContinuous(d.nonWhite_percent));
            return color;
          })
          ;

        if(stage == 3){
          adjustAxis(genreSelected);

          function axisSize(size){
            return filmElements.filter(function(d){
              return d.nonWhite_percent < size;
            }).size();
          }

          markerFixed.transition().duration(250).style("left",axisSize(data.nonWhite_percent)+"px");
          previewNameContainerFixed.transition().duration(250).style("left",axisSize(data.nonWhite_percent)+"px");
          previewNameContainerFixed.select("div").text(data.title);

          d3.select(".histogram-two-script-container").remove();
          changeMovieLines(data)
          d3.select(".histogram-two-script-container").style("visibility","visible");

          ;
        }
        else if(stage==2){

          var element = filmElements
            .filter(function(d,i){
              return data.script_id == d.script_id;
            })
            ;

          previewName.text(data.title);
          previewData.data([data.nonWhite_percent,1-data.nonWhite_percent]).enter();

          previewData.select(".histogram-two-data-preview-percent")
            .text(function(d,i){
              return percentFormat(d);
            });

          previewData.select(".histogram-two-data-preview-bar")
            .transition()
            .duration(200)
            .style("width",function(d){
              return previewDataBarScale(d) + "px";
            });

          var leftPosition = +element.style("left").replace("px","");
          var topPosition = +element.style("top").replace("px","");
          if(mobile){
            markerBubble.style("left",leftPosition-3+"px").transition().duration(100).style("opacity",1);
            markerBubble.style("top",topPosition+markerBubbleTopOffset+"px").transition().duration(100).style("opacity",1);
            previewNameContainer.style("top",topPosition+previewTopOffset+"px");
            if(leftPosition<100){
              previewNameContainer.style("left",leftPosition+20+"px");
            }
            else if(leftPosition > 275){
              previewNameContainer.style("left",leftPosition-180+"px");
            }
            else {
              previewNameContainer.style("left",leftPosition-80+"px");
            }

            d3.select(".histogram-two-script-container").remove();
            changeMovieLines(data)
            d3.select(".histogram-two-script-container").style("visibility","visible");

          }else{
            markerBubble.style("left",leftPosition-3+"px").transition().duration(100).style("opacity",1);
            markerBubble.style("top",(topPosition+markerBubbleTopOffset)+"px").transition().duration(100).style("opacity",1);
            previewNameContainer.style("top",topPosition+previewTopOffset+"px");
            previewNameContainer.style("left",leftPosition-73+"px");
          }
          previewNameContainer.style("display","block");



        }

      }

      function updateSpectrum(id){

        if(stage == 2 && mobile != 1){
          markerBubble.transition().duration(100).style("opacity",0);
          previewNameContainer.style("display","none");
        }

        var filteredSpectrumData = spectrumData.filter(function(d,i){
          var string = d.genreList;
          if(id == "all" && stage == 3){
            return +d.gross > 45;
          }
          else if(id =="all" && stage == 2){
            return d;
          }
          else if(stage == 3){
            var substring = genreSelected;
            return +d.gross > 45 && string.indexOf(substring) > -1;
          }
          var substring = id;
          return string.indexOf(substring) > -1
        })
        ;

        var nonWhitePercentOrder = {};

        //genre-mapping
        for (item in filteredSpectrumData){
          var nonWhitePercentBucket = filteredSpectrumData[item].nonWhite_percent;
          if(nonWhitePercentBucket in nonWhitePercentOrder){
            nonWhitePercentOrder[nonWhitePercentBucket] = nonWhitePercentOrder[nonWhitePercentBucket] + 1
          }
          else{
            nonWhitePercentOrder[nonWhitePercentBucket] = 0;
          }
          filteredSpectrumData[item].yOrder = nonWhitePercentOrder[nonWhitePercentBucket];
          ;
        }

        filmElements = filmElements.data(filteredSpectrumData,function(d){
          return d.imdb_id;
        })
        ;

        filmElements
          .exit()
          .style("background-color",function(d){
            if(stage == 2){
              return "rgba(0, 222, 170, 0.56)";
            }
            return d3.rgb(colorScaleContinuous(d.nonWhite_percent));
          })
          .transition()
          .duration(500)
          .delay(function(d,i){
            return i*Math.random()/2;
          })
          .style("opacity",0)
          .remove()
          ;

        filmElements
          .style("background-color",function(d){
            var color = d3.rgb(colorScaleContinuous(d.nonWhite_percent));
            return color;
          })
          .style("left",function(d,i){
            if (stage == 2){
              if(mobile){
                return Math.floor(cx(d.nonWhite_percent)) + "px";
              }
              return cx(d.nonWhite_percent) + "px";
            }
            return i+"px";
          })
          .transition()
          .duration(500)
          .delay(function(d,i){
            if(stage == 2){
              return i*Math.random()/2 + 900;
            }
            return i*Math.random()/2;
          })
          .style("top",function(d,i){
            if (stage == 2){
              return d.yOrder*7 + mobileBubbleOffset + "px";
            }
            return "-20px";
          })
          .style("width",function(d){
            if (stage == 2){
              if(mobile){
                return "5px";
              }
              return "6px";
            }
            return "1px"
          })
          .style("height",function(d){
            if (stage == 2){
              if(mobile){
                return "5px";
              }
              return "6px";
            }
            return "40px"
          })
          ;

        filmElements
          .enter()
          .append("div")
          .attr("class","film-element")
          .style("background-color",function(d){
            if(stage==2){
              return "rgba(0, 0, 0, 0.01)";
              // var color = d3.rgb(colorScaleContinuous(d.nonWhite_percent));
              // return color;
            }
            return "#fff";
          })
          .style("width",function(d){
            if (stage == 2){
              if(mobile){
                return "5px";
              }
              return "6px";
            }
            return "1px"
          })
          .style("height",function(d){
            if (stage == 2){
              if(mobile){
                return "5px";
              }
              return "6px";
            }
            return "40px"
          })
          .style("top",function(d,i){
            if (stage == 2){
              return d.yOrder*7 + mobileBubbleOffset + "px";
            }
            return "-20px";
          })
          .style("left",function(d,i){
            if (stage == 2){
              if(mobile){
                return Math.floor(cx(d.nonWhite_percent)) + "px";
              }
              return cx(d.nonWhite_percent) + "px";
            }
            return i+"px";
          })
          .on("mouseover",function(d,i){
            var data = d,
                order = i,
                element = this;
            elementMouseover(element,data,order);
          })
          .on("mouseout",function(d,i){
            var data = d,
                order = i,
                element = this;
            elementMouseout(element,data,order);
          })
          .on("click",function(d,i){
            var data = d,
                order = i,
                element = this;
            elementClick(element,data,order);
          })
          .on("touchstart",function(d,i){
            var data = d,
                order = i,
                element = this;
            elementTouchstart(element,data,order);
          })
          .transition()
          .duration(function(){
            if(stage==2){
              return 0
            }
            return 300;
          })
          .delay(function(d,i){
            if(stage == 2){
              return i*Math.random() + 900;
            }
            return 500;
          })
          .style("background-color",function(d){
            var color = d3.rgb(colorScaleContinuous(d.nonWhite_percent));
            return color;
          })
          ;

        if(stage == 3){
          adjustAxis(genreSelected);
          markerFixed.transition().duration(300).style("left","0px");
          previewNameContainerFixed.transition().duration(300).style("left","0px");
          previewNameContainerFixed.select("div").text(function(){
            return filmElements.filter(function(d,i){
              return i==0;
            })
            .datum().title;
          })

          var changeMovieLinesData = filmElements.filter(function(d,i){
            return i==0;
          })
          ;

          d3.select(".histogram-two-script-container").remove();
          changeMovieLines(changeMovieLinesData.datum());
          d3.select(".histogram-two-script-container").style("visibility","visible");
          ;

        }
        if(stage == 2){
          markerFixed.transition().duration(300).style("left","0px");
          previewNameContainerFixed.transition().duration(300).style("left","0px");
          previewNameContainerFixed.select("div").text(function(){
            return filmElements.filter(function(d,i){
              return i==0;
            })
            .datum().title;
          });

          var changeMovieLinesData = filmElements.filter(function(d,i){
            return i==0;
          })
          ;
          d3.select(".histogram-two-script-container").remove();
          changeMovieLines(changeMovieLinesData.datum());

        }

      }

      function adjustAxis(genre){

        function axisSize(size){
          return filmElements.filter(function(d){
            return d.nonWhite_percent < size;
          }).size();
        }
        var delayAmount = 200;
        var durationAmount = 1500;
        //
        // markerFixed.style("left",0);
        // previewNameFixed.text(function(d){
        //   return d3.select(".histogram-two-line").datum().title;
        // });
        //
        if (genre == "all"){
          nonWhiteTop.transition().duration(durationAmount).delay(delayAmount).style("opacity",1).style("left",filmElements.size() - 1 +"px");
          whiteTop.transition().duration(durationAmount).delay(delayAmount).style("opacity",1);
          whiteForty.transition().duration(durationAmount).delay(delayAmount).style("opacity",1).style("left",axisSize(0.4)+"px");;
          whiteTen.transition().duration(durationAmount).delay(delayAmount).style("opacity",1).style("left",axisSize(0.1)+"px");;
          whiteTwentyFive.transition().duration(durationAmount).delay(delayAmount).style("opacity",1).style("left",axisSize(0.25)+"px");;
          nonWhiteSixty.transition().duration(durationAmount).delay(delayAmount).style("opacity",1).style("left",axisSize(0.6)+"px");;
          midPoint.transition().duration(durationAmount).delay(delayAmount).style("left",axisSize(0.5)+"px");
          markerFixed.transition().duration(durationAmount).delay(delayAmount).style("display","block");
          previewNameContainerFixed.transition().duration(durationAmount).delay(delayAmount).style("display","block");
        }
        else{
          nonWhiteTop.transition().duration(100).style("opacity",0);
          whiteTop.transition().duration(100).style("opacity",0);
          whiteForty.transition().duration(100).style("opacity",0);
          whiteTen.transition().duration(100).style("opacity",0);
          whiteTwentyFive.transition().duration(100).style("opacity",0);
          nonWhiteSixty.transition().duration(100).style("opacity",0);
          midPoint.transition().duration(500).style("left",axisSize(0.5)+"px");
        }

      }

      var stageTwoElement = ".star-chart";
      if(mobile){
        stageTwoElement = ".mobile-stage-two"
      }

      var axisWidth = 900;
      if(mobile){
        axisWidth = width;
        d3.select(stageTwoElement).style("width",width + "px");
      }

      histogramTwoAxis = d3.select(stageTwoElement)
        .append("div")
        .attr("class","star-chart-axis")
        ;

      var whiteTop = histogramTwoAxis.append("div")
        .style("left","0%")
        .attr("class","histogram-two-axis-tick")
        .style("border-color",whiteColor)

      var whiteTopText = whiteTop
        .append("p")
        .style("color",whiteColor)
        .style("left","-1px")
        .style("width","100px")
        .attr("class","histogram-two-axis-text tk-futura-pt")
        .html("100% of Words<br>are white")
        ;

      var nonWhiteTop = histogramTwoAxis.append("div")
        .style("left",axisWidth - 1 +"px")
        .attr("class","histogram-two-axis-tick")
        .style("border-color",nonWhiteColor)
        ;

      var yAxisHistogramTwo = histogramTwoAxis.append("div")
        .attr("class","histogram-two-y-axis tk-futura-pt")
        ;

      yAxisHistogramTwo.append("div")
        .attr("class","histogram-two-y-axis-tick")
        .append("p")
        .attr("class","histogram-two-y-axis-text")
        .text("'80")
        ;

      yAxisHistogramTwo.append("div")
        .attr("class","histogram-two-y-axis-tick")
        .style("top","89px")
        .append("p")
        .attr("class","histogram-two-y-axis-text")
        .text("'95")
        ;

      yAxisHistogramTwo.append("div")
        .attr("class","histogram-two-y-axis-tick")
        .style("top","180px")
        .append("p")
        .attr("class","histogram-two-y-axis-text")
        .text("'16")
        ;

      var nonWhiteTopText = nonWhiteTop
        .append("p")
        .style("color",nonWhiteColor)
        .style("left",function(){
          if(mobile){
            if(smallMobile){
              return "-77px";
            }
            return "-73px";
          }
          return "-68px";
        })
        .style("width","80px")
        .style("text-align","right")
        .attr("class","histogram-two-axis-text tk-futura-pt")
        .html("100% of Words<br>are nonwhite")
        ;

      var whiteTen = histogramTwoAxis.append("div")
        .style("left",axisWidth*(0.1)+"px")
        .attr("class","histogram-two-axis-tick")
        .style("border-color",whiteColor)

      var whiteTenText = whiteTen
        .append("p")
        .style("color",whiteColor)
        .attr("class","histogram-two-axis-text tk-futura-pt")
        .html("<br>90%")
        ;

      var whiteTwentyFive = histogramTwoAxis.append("div")
        .style("left",axisWidth*(0.25)+"px")
        .attr("class","histogram-two-axis-tick")
        .style("border-color",whiteColor)

      var whiteTwentyFiveText = whiteTwentyFive
        .append("p")
        .style("color",whiteColor)
        .attr("class","histogram-two-axis-text tk-futura-pt")
        .html("<br>75%")
        ;

      var whiteForty = histogramTwoAxis.append("div")
        .style("left",axisWidth*(0.40)+"px")
        .attr("class","histogram-two-axis-tick")
        .style("border-color",whiteColor)

      var whiteFortyText = whiteForty
        .append("p")
        .style("color",whiteColor)
        .attr("class","histogram-two-axis-text tk-futura-pt")
        .html("<br>60%")
        ;

      var midPoint = histogramTwoAxis.append("div")
        .style("left",axisWidth*(0.50)+"px")
        .attr("class","histogram-two-axis-tick")
        .style("border-color","#4E4D4D")

      var midPointText = midPoint
        .append("p")
        .style("color","#4E4D4D")
        .attr("class","histogram-two-axis-text histogram-two-axis-mid tk-futura-pt")
        .html("50/50<br>Race Split")
        ;

      var nonWhiteSixty = histogramTwoAxis.append("div")
        .style("left",axisWidth*(0.60)+"px")
        .attr("class","histogram-two-axis-tick")
        .style("border-color",nonWhiteColor)

      var nonWhiteSixtyText = nonWhiteSixty
        .append("p")
        .style("color",nonWhiteColor)
        .attr("class","histogram-two-axis-text tk-futura-pt")
        .html("<br>60%")
        ;

      var marker = d3.select(".star-chart-axis")
        .append("div")
        .attr("class","histogram-two-marker")
        ;

      var markerBubble = d3.select(".star-chart-axis")
        .append("div")
        .attr("class","histogram-two-marker-bubble")
        ;

      var markerFixed = d3.select(".star-chart-axis")
        .append("div")
        .attr("class","histogram-two-marker-fixed")
        ;

      var previewNameContainerFixed = d3.select(".star-chart-axis")
        .append("div")
        .attr("class","histogram-two-name-container-fixed tk-futura-pt")
        ;

      var previewNameContainer = d3.select(".star-chart-axis")
        .append("div")
        .attr("class","histogram-two-name-container tk-futura-pt")
        ;

      var previewNameFixed = previewNameContainerFixed.append("div")
        .attr("class","histogram-two-name-fixed tk-futura-pt")
        .style("color","rgb(0, 0, 0)")
        .text("The Truman Show")
        ;

      var previewName = previewNameContainer.append("div")
        .attr("class","histogram-two-name tk-futura-pt")
        .style("color","rgb(0, 0, 0)")
        .text(function(){
          if(mobile){
            return "Eternal Sunshine of the Spotless Mind"
          }
          return "The Truman Show"
        })
        ;

      var previewDataBarScale = d3.scale.linear().domain([0,1]).range([0,50])

      var previewDataArray = [0.5,0.6];
      if(mobile){
        previewDataArray = [.52,.48];
      }

      var previewData = previewNameContainer
        .append("div")
        .attr("class","histogram-two-data-preview tk-futura-pt")
        .selectAll("div")
        .data(previewDataArray,function(d){
          return d;
        })
        .enter()
        .append("div")
        .attr("class","histogram-two-data-preview-row")
        ;

      if(!mobile){
        var previewDataLabel = previewData.append("p")
          .attr("class","histogram-two-data-preview-label tk-futura-pt")
          .text(function(d,i){
            if(i==0){
              return "nonwhite words";
            }
            return "white words";
          });
      }

      if(mobile){
        previewDataLabel = previewData.append("p")
          .attr("class","histogram-two-data-preview-label-mobile tk-futura-pt")
          .text(function(d,i){
            if(i==0){
              return "nonwhite words";
            }
            return "white words";
          });
      }

      var previewDataBar = previewData.append("div")
        .attr("class","histogram-two-data-preview-bar")
        .style("width",function(d){
          return previewDataBarScale(d) + "px";
        })
        .style("background-color",function(d,i){
          if (i==0){
            return nonWhiteColor;
          }
          return whiteColor;
        });

      var previewDataPercent = previewData.append("p")
        .attr("class","histogram-two-data-preview-percent tk-futura-pt")
        .text(function(d,i){
          return percentFormat(d);
        });

      function elementMouseover(element,data,item){
        if(!mobile){
          previewName.text(data.title);
          previewData.data([data.nonWhite_percent,1-data.nonWhite_percent]).enter();

          previewData.select(".histogram-two-data-preview-percent")
            .text(function(d,i){
              return percentFormat(d);
            });

          previewData.select(".histogram-two-data-preview-bar")
            .transition()
            .duration(200)
            .style("width",function(d){
              return previewDataBarScale(d) + "px";
            });
          var leftPosition = +d3.select(element).style("left").replace("px","");
          var topPosition = +d3.select(element).style("top").replace("px","");
          if(+d3.select(element).style("width").replace("px","") > 2){
            markerBubble.style("left",leftPosition-3+"px").transition().duration(100).style("opacity",1);
            markerBubble.style("top",(topPosition+markerBubbleTopOffset)+"px").transition().duration(100).style("opacity",1);
            previewNameContainer.style("top",topPosition+previewTopOffset+"px");
            previewNameContainer.style("left",leftPosition-73+"px");
          }
          else{
            marker.style("left",leftPosition-5+"px").transition().duration(100).style("opacity",1);
            previewNameContainer.style("top",topPosition+79+"px");
          }
          previewNameContainer.style("left",leftPosition-73+"px");
          previewNameContainer.style("display","block");
        }
      }
      function elementMouseout(element,data,item){
        if(!mobile){
          if(+d3.select(element).style("width").replace("px","") > 2){
            markerBubble.transition().duration(100).style("opacity",0);
          }
          {
            marker.transition().duration(100).style("opacity",0);
          }
          previewNameContainer.style("display","none");
        }
      }
      function elementClick(element,data,item){
        if(!mobile){
          d3.select(".histogram-two-script-container").remove();
          var leftPosition = +d3.select(element).style("left").replace("px","");
          var topPosition = +d3.select(element).style("top").replace("px","");
          if(stage == 3){
            markerFixed.transition().duration(250).style("left",leftPosition-5+"px");
            previewNameContainerFixed.transition().duration(250).style("left",leftPosition-5+"px");
            previewNameContainerFixed.select("div").text(data.title);
            changeMovieLines(data)
            d3.select(".histogram-two-script-container").style("visibility","visible");
          }
        }
      }
      function elementTouchstart(element,data,item){

        // console.log("hit");

        d3.select(".histogram-two-script-container").remove();

        previewName.text(data.title);
        previewData.data([data.nonWhite_percent,1-data.nonWhite_percent]).enter();

        previewData.select(".histogram-two-data-preview-percent")
          .text(function(d,i){
            return percentFormat(d);
          });

        previewData.select(".histogram-two-data-preview-bar")
          .transition()
          .duration(200)
          .style("width",function(d){
            return previewDataBarScale(d) + "px";
          });

        var leftPosition = +d3.select(element).style("left").replace("px","");
        var topPosition = +d3.select(element).style("top").replace("px","");

        markerBubble.style("left",leftPosition-3+"px").transition().duration(100).style("opacity",1);
        markerBubble.style("top",topPosition+markerBubbleTopOffset+"px").transition().duration(100).style("opacity",1);
        if(leftPosition<100){
          previewNameContainer.style("left",leftPosition+20+"px");
        }
        else if(leftPosition > 275){
          previewNameContainer.style("left",leftPosition-180+"px");
        }
        else {
          previewNameContainer.style("left",leftPosition-80+"px");
        }
        previewNameContainer.style("top",topPosition+previewTopOffset+"px");

        changeMovieLines(data)
        d3.select(".histogram-two-script-container").style("visibility","visible");
      }

      function changeMovieLines(data){

        var stageTwoElement = ".star-chart";
        if(mobile){
          stageTwoElement = ".mobile-stage-two"
        }

        var scriptLinesContainer = d3.select(stageTwoElement).append("div")
          .attr("class","histogram-two-script-container tk-futura-pt")

        var scriptLinesTitle = scriptLinesContainer
          .append("div")
          .attr("class","script-lines-title")
          ;

        scriptLinesTitle.append("p")
          .text(function(){
            return data.title;
          })
          .attr("class","script-lines-title-big")
          .style("margin-top","67px")
          .style("opacity",0)
          .transition()
          .duration(600)
          .style("margin-top","87px")
          .style("opacity",1)
          ;

        var scriptLinesPercentContainer = scriptLinesTitle.append("div")
          .attr("class","script-lines-title-sub")
          ;

        scriptLinesPercentContainer.append("p")
          .html(function(d){
            var percent = "<span style='color:"+whiteColor+";'>"+percentFormat(1-data.nonWhite_percent)+" White</span>/<span style='color:"+nonWhiteColor+";'>"+percentFormat(data.nonWhite_percent)+" Nonwhite</span>";
            return percent;
          })
          .attr("class","script-lines-title-sub-percent")
          ;

        var scriptLines = scriptLinesContainer
          .append("div")
          .attr("class","histogram-two-script-data")
          ;

        // var valuesLines = [];
        // var linesScale = d3.scale.quantize().domain([.6,1]).range(["w","nw"])
        // for (var line in d3.range(800)){
        //   valuesLines.push(linesScale(Math.random()));
        // }
        // var lineBreakdown = {};
        //
        // for (var line in valuesLines){
        //   var minute = Math.ceil((+line+1)/14);
        //   if (minute in lineBreakdown){
        //     if(valuesLines[line] == "w"){
        //       lineBreakdown[minute][0] = lineBreakdown[minute][0] + 1;
        //     }
        //     else{
        //       lineBreakdown[minute][1] = lineBreakdown[minute][1] + 1
        //     }
        //   }
        //   else{
        //     lineBreakdown[minute] = [0,0];
        //     if(valuesLines[line] == "w"){
        //       lineBreakdown[minute][0] = 1;
        //     }
        //     else{
        //       lineBreakdown[minute][1] = 1;
        //     }
        //   }
        // }
        //
        // var lineData = [];
        // var minutes = Object.keys(lineBreakdown);
        // for (minute in minutes){
        //   lineData.push(lineBreakdown[minutes[minute]])
        // }

        var lineData = [];

        var lineInfo = data.lines_data.match(/.{1,2}/g);
        for (line in lineInfo){
          var minuteTotal = +lineInfo[line].slice(0,1) + +lineInfo[line].slice(1,2);
          var row = [minuteTotal,14-minuteTotal];
          lineData.push(row);
        }

        var scriptLinesDataLines = scriptLines
          .selectAll("div")
          .data(lineData)
          .enter()
          .append("div")
          .attr("class","script-line-minute")
          .style("opacity",0)
          ;

        scriptLinesDataLines
          .transition()
          .duration(0)
          .delay(function(d,i){
            return i*10;
          })
          .style("opacity",1)
          ;

        var scriptLinenonWhiteScale = d3.scale.linear().domain([0,14]).range(["#CCC",nonWhiteColor]);
        var scriptLinewhiteScale = d3.scale.linear().domain([0,14]).range(["#CCC",whiteColor]);
        var barHeight = 50;

        scriptLinesDataLines.selectAll("div")
          .data(function(d){
            return d;
          })
          .enter()
          .append("div")
          .attr("class","script-line-minute-bar")
          .style("background-color",function(d,i){
            if(i == 1){
              return scriptLinenonWhiteScale(d);
            }
            return scriptLinewhiteScale(d);
          })
          .style("height",function(d,i){
            return ((d/14)*barHeight/2)+"px";
          })
          .style("top",function(d,i){
            if(i==1){
              return 100-((d/14)*barHeight/2) + "px";
            }
            return 100+2 + "px";
          })
          ;

        var startLabel = scriptLinesDataLines.filter(function(d,i){
            return i==0;
          })
          .append("div")
          .attr("class","histogram-two-script-data-axis-box tk-futura-pt")
          .style("top",function(d,i){
            return 105+((d[0]/14)*barHeight/2) + "px";
          })
          .style("height",function(d,i){
            var height = (barHeight/2 - (d[0]/14*barHeight/2));
            return height + "px";
          })
          .append("p")
          .attr("class","histogram-two-script-data-axis-label histogram-two-script-data-axis-label-start tk-futura-pt")
          .text("Start of Film")
          ;

        var endLabel = scriptLinesDataLines.filter(function(d,i){
            return i==(lineData.length - 1);
          })
          .append("div")
          .attr("class","histogram-two-script-data-axis-box tk-futura-pt")
          .style("top",function(d,i){
            return 105+((d[0]/14)*barHeight/2) + "px";
          })
          .style("height",function(d,i){
            var height = (barHeight/2 - (d[0]/14*barHeight/2));
            return height + "px";
          })
          .append("p")
          .attr("class","histogram-two-script-data-axis-label histogram-two-script-data-axis-label-start tk-futura-pt")
          .text("End of Film")
          ;

        function ordinal_suffix_of(i) {
          var j = i % 10,
              k = i % 100;
          if (j == 1 && k != 11) {
              return i + "st";
          }
          if (j == 2 && k != 12) {
              return i + "nd";
          }
          if (j == 3 && k != 13) {
              return i + "rd";
          }
          return i + "th";
        }

        var midLabel = scriptLinesDataLines.filter(function(d,i){
            return i==Math.round((lineData.length - 1)/2);
          })
          .append("div")
          .attr("class","histogram-two-script-data-axis-box tk-futura-pt")
          .style("top",function(d,i){
            return 105+((d[0]/14)*barHeight/2) + "px";
          })
          .style("height",function(d,i){
            var height = (barHeight/2 - (d[0]/14*barHeight/2));
            return height + "px";
          })
          .append("p")
          .attr("class","histogram-two-script-data-axis-label histogram-two-script-data-axis-label-start tk-futura-pt")
          .text(function(d){
            var num = Math.round((lineData.length - 1)/2);

            return ordinal_suffix_of(num) + " MINUTE OF DIALOGUE"
          })
          .style("bottom","-34px")
          .style("line-height","10px")
          ;

        scriptLines
          .append("p")
          .attr("class","histogram-two-script-data-label histogram-two-script-data-label-nonwhite tk-futura-pt")
          .style("color",nonWhiteColor)
          .text("nonwhite Lines")
          ;

        scriptLines
          .append("p")
          .attr("class","histogram-two-script-data-label tk-futura-pt")
          .style("color",whiteColor)
          .text("white Lines")
          ;

        scriptLines
          .append("p")
          .attr("class","script-lines-cast-title-two")
          .text(function(d){
            return "white/nonWhite Lines by minute"
          })
          ;

        // scriptLines
        //   .append("p")
        //   .attr("class","histogram-two-script-data-axis-count histogram-two-script-data-axis-count-men tk-futura-pt")
        //   .text("82%")
        //   .style("color",whiteColor)
        //   ;
        //
        // scriptLines
        //   .append("p")
        //   .attr("class","histogram-two-script-data-axis-count histogram-two-script-data-axis-count-women tk-futura-pt")
        //   .text("18%")
        //   .style("color",nonWhiteColor)
        //   ;

        var scriptLinesCastContainer = scriptLinesContainer
          .append("div")
          .attr("class","script-lines-cast-container")
          ;

        var peopleList = characterMap.get(data.script_id).values;

        peopleList = peopleList.sort(function(b, a){
          var o1 = +a.words;
          var o2 = +b.words;

          if (o1 < o2) return -1;
          if (o1 > o2) return 1;
          return 0;
        })
        ;

        var scriptLinesCast = scriptLinesCastContainer.selectAll("div")
          .data(peopleList.slice(0,5), function(d,i){
            return d.imdb_character_name + " " + d.script_id;
          })
          .enter()
          .append("div")
          .sort(function(a, b){
            return d3.descending(+a.words, +b.words);
          })
          .attr("class","script-lines-cast-row")
          ;

          scriptLinesCast
            .style("opacity",0)
            .transition()
            .duration(0)
            .delay(function(d,i){
              return i*100;
            })
            .style("opacity",null)
            ;

          scriptLinesCast
            .append("p")
            .attr("class","script-lines-cast-name")
            .text(function(d){
              return commaFormat(Math.round(+d.words));
            })
            ;

          scriptLinesCast
            .append("div")
            .attr("class","script-lines-cast-bar")
            .style("width",function(d){
              var totalWords = scriptMap.get(data.script_id).total_words;
              return 75*(d.words/totalWords)+"px";
            })
            .style("background-color",function(d){
              if(d.race == "w"){
                return whiteColor;
              }
              return nonWhiteColor;
            })
            ;

            scriptLinesCast
              .append("p")
              .attr("class","script-lines-cast-amount")
              .text(function(d){
                if (d.imdb_character_name.length > 14){
                  return d.imdb_character_name.slice(0,12)+"..."
                }
                return d.imdb_character_name;
              })
              ;

            scriptLinesCastContainer
              .append("p")
              .attr("class","script-lines-cast-title")
              .text(function(d){
                return "Top 5 Characters (by # of words)"
              })
              ;

      }

      var castData = spectrumData.filter(function(d){
        if(mobile){
          return d.script_id == "2240";
        }
        return d.script_id == "1434";

      });
      changeMovieLines(castData[0]);

      // var spriteScript = d3.select(".script-sprite")
      // ;
      //
      // var spriteScriptTwo = d3.select(".script-sprite-two")
      //   ;
      //
      // spriteScript.append("svg")
      //   .attr("class","script-sprite-container").selectAll("rect")
      //   .data(d3.range(50))
      //   .enter()
      //   .append("rect")
      //   .attr("class","script-sprite-rect")
      //   .attr("y",function(d,i){
      //     if (d % 2 == 0){
      //       return 0
      //     }
      //     else if(d >40 || d<10){
      //       return 0;
      //     }
      //     return 9;
      //   })
      //   .style("fill",function(d,i){
      //     if (d % 2 == 0){
      //       return whiteColor;
      //     }
      //     else if(d >40 || d<10){
      //       return whiteColor;
      //     }
      //     return nonWhiteColor;
      //   })
      //   .attr("x",function(d,i){
      //     return i;
      //   })
      //   ;
      //
      // spriteScriptTwo.append("svg")
      //   .attr("class","script-sprite-container").selectAll("rect")
      //   .data(d3.range(50))
      //   .enter()
      //   .append("rect")
      //   .attr("class","script-sprite-rect")
      //   .attr("y",function(d,i){
      //     if (d < 20){
      //       return 0
      //     }
      //     else if(d >30){
      //       return 0;
      //     }
      //     return 9;
      //   })
      //   .style("fill",function(d,i){
      //     if (d < 20){
      //       return whiteColor;
      //     }
      //     else if(d >30){
      //       return whiteColor;
      //     }
      //     return nonWhiteColor;
      //   })
      //   .attr("x",function(d,i){
      //     return i;
      //   })
      //   ;

      d3.selectAll(".filter-item-spectrum").on("click",function(d){
        var id = d3.select(this).attr("id");
        d3.selectAll(".filter-item-spectrum").style("background-color",null).style("box-shadow",null).style("border-color",null).style("font-weight",null);
        d3.select(this).style("background-color","#F5F5F5").style("box-shadow","inset 0 3px 5px rgba(0,0,0,.125)").style("border-color","#adadad").style("font-weight","500");
        genreSelected = id;
        updateSpectrum(id);
      });

      function searchSpectrum(){

        var searchArray = [];
        var searchResults = d3.selectAll(".search-results");
        var searchResultMouseOver = false;

        var searchInput = d3.selectAll(".search-films").select("input")
              .on("keyup", keyupedFilmColumn);

        function keyupedFilmColumn() {
          searchFilmColumn(this.value.trim());
        }

        function searchFilmColumn(value) {
          if (value.length > 2) {
            searchResults.style("display","block");
            var re = new RegExp("\\b" + d3.requote(value), "i");
            genreSelected = "all";
            var filteredSpectrumData = spectrumData.filter(function(d,i){
              var string = d.genreList;
              if(genreSelected == "all" && stage == 3){
                return +d.gross > 45;
              }
              else if(genreSelected =="all" && stage == 2){
                return d;
              }
              else if(stage == 3){
                var substring = genreSelected;
                return +d.gross > 45 && string.indexOf(substring) > -1;
              }
              return string.indexOf(substring) > -1
            })
            ;

            searchArray = _.filter(filteredSpectrumData, function(d,i) {
              return re.test(d["title"]);
            })
            ;

            //
            var searchDivData = searchResults.selectAll("p")
              .data(searchArray, function(d){
                return d["imdb_id"];
              })
              ;

            var searchEnter = searchDivData
              .enter()
              .append("p")
              .attr("class","tk-futura-pt search-result")
              .html(function(d){
                var final_str = d.title.replace(re, function(str) {return '<b><u>'+str+'</u></b>'});
                var percent = "<span class='search-result-percent'><span style='color:"+whiteColor+";'>"+percentFormat(1-d.nonWhite_percent)+"</span>/<span style='color:"+nonWhiteColor+";'>"+percentFormat(d.nonWhite_percent)+"</span></span>";
                return final_str + " " + percent;
              })
              .on("click",function(d){
                genreSelected = "all";
                updateSpectrumSearch(d);
                d3.selectAll(".filter-item-spectrum").style("background-color",null).style("box-shadow",null).style("border-color",null).style("font-weight",null);
                d3.select(".filter-item-spectrum").style("background-color","#F5F5F5").style("box-shadow","inset 0 3px 5px rgba(0,0,0,.125)").style("border-color","#adadad").style("font-weight","500");
                if(mobile){
                  searchResults.style("display","none");
                }
              })
              ;

            searchDivData.exit().remove();


          } else{
            searchResults.style("display","none");
          }

        };
      }

      searchSpectrum();

      if(mobile){
        filmElements = d3.select(".mobile-stage-two")
          .append("div")
          .attr("class","star-chart-data")
          .selectAll("div")
          .data(spectrumData,function(d){
            return d.imdb_id;
          })
          ;

        stageTwo();

      }


    }

    // function disneySample(){
    //
    //   var disneyDiv = d3.select(".star-chart")
    //     .append("div")
    //     .attr("class","disney-data")
    //     // .style("width",width+"px")
    //     ;
    //
    //     // var nonWhiteColor = "#E0451F"
    //     var nonWhiteColor = "#E0451F"
    //     //var whiteColor = "#249EFB" //var whiteColor = "#2161FA"
    //     var whiteColor = "#18638B" //var whiteColor = "#2161FA" //18638B
    //
    //
    //   // var whiteColor = "#18638B"
    //   // var nonWhiteColor = "#E0451F"
    //
    //   var disneyScalenonWhite = d3.scale.linear().domain([0,1]).range(["#CCC",nonWhiteColor]);
    //   var disneyScalewhite = d3.scale.linear().domain([0,1]).range(["#CCC",whiteColor]);
    //
    //   // var disneyScalenonWhite = d3.scale.linear().domain([0,.5,1]).range(["#FFF","#CCC",nonWhiteColor]);
    //   // var disneyScalewhite = d3.scale.linear().domain([0,.5,1]).range(["#FFF","#CCC","#2161FA"]);
    //
    //   // var disneyScalenonWhite = d3.scale.linear().domain([0,1]).range(["#CCC",nonWhiteColor]);
    //   // var disneyScalewhite = d3.scale.linear().domain([0,1]).range(["#CCC","#2161FA"]);
    //
    //
    //   var randomScale = d3.scale.linear().domain([0,1]).range([0,movieData.length]);
    //   var bucketAssign = d3.scale.quantize().domain([0,1]).range(["a","b","c"]);
    //
    //   var disneyData = [];
    //
    //   for (item in d3.range(50)){
    //     var element = movieData[Math.floor(randomScale(Math.random()))];
    //     element.disneyBucket = bucketAssign(element.nonWhite_percent)
    //     disneyData.push(element);
    //   }
    //
    //   var disneyNest = d3.nest().key(function(d) {
    //       return d.disneyBucket
    //     })
    //     .sortKeys(d3.ascending)
    //     .sortValues(function(a,b) {
    //       if (a.nonWhite_percent < 0.333){
    //         return ((a.nonWhite_percent < b.nonWhite_percent) ? -1 : 1);
    //         return 0;
    //       }
    //       else {
    //         return ((a.nonWhite_percent > b.nonWhite_percent) ? -1 : 1);
    //         return 0;
    //       }
    //     })
    //     .entries(disneyData);
    //
    //   var disneyBuckets = disneyDiv.selectAll("div")
    //     .data(disneyNest)
    //     .enter()
    //     .append("div")
    //     .attr("class","disney-bucket")
    //     ;
    //
    //   var disneyRow = disneyBuckets.selectAll("div")
    //     .data(function(d){
    //       return d.values;
    //     })
    //     .enter()
    //     .append("div")
    //     .attr("class","disney-row")
    //     ;
    //   //
    //   var rowText = disneyRow.append("p")
    //     .attr("class","disney-row-text tk-futura-pt")
    //     .text(function(d){
    //       if(d.title.length > 14){
    //         return d.title.slice(0,12)+"...";
    //       }
    //       return d.title;
    //     })
    //     ;
    //
    //   var barContainer = disneyRow.append("div")
    //     .attr("class","disney-column-container tk-futura-pt")
    //     ;
    //
    //   var whiteBar = barContainer.append("div")
    //     .attr("class","film-white-bar film-bar")
    //     .style("background-color", function(d){
    //       return disneyScalewhite(1-d.nonWhite_percent);
    //     })
    //     .style("width", function(d){
    //       return 100*(1-d.nonWhite_percent) + "%";
    //     })
    //     ;
    //
    //   var nonWhiteBar = barContainer.append("div")
    //     .attr("class","film-nonWhite-bar film-bar")
    //     .style("background-color", function(d){
    //       return disneyScalenonWhite(d.nonWhite_percent);
    //     })
    //     ;
    //
    //   var statContainer = disneyRow.append("div")
    //     .attr("class","disney-stat-container tk-futura-pt")
    //     ;
    //
    //   statContainer.append("div")
    //     .attr("class","disney-nonWhite-stat tk-futura-pt")
    //     .style("color",function(d){
    //       if (d.nonWhite_percent < 0.3333){
    //         return whiteColor;
    //       }
    //       else if (d.nonWhite_percent > 0.666665){
    //         return nonWhiteColor;
    //       }
    //     })
    //     .html(function(d,i){
    //       if (i==0 && d.nonWhite_percent < .33){
    //         return percentFormat(1-d.nonWhite_percent) + " white Lines"
    //       }
    //       else if (i==0 && d.nonWhite_percent > .6666665){
    //         return percentFormat(d.nonWhite_percent) + " nonWhite Lines"
    //       }
    //       else if (i % 5 == 0 && d.nonWhite_percent < .33){
    //         return percentFormat(1-d.nonWhite_percent)
    //       }
    //       else if (i % 5 == 0 && d.nonWhite_percent > .66666665){
    //         return percentFormat(d.nonWhite_percent)
    //       }
    //       else if (i % 5 == 0){
    //         return "<span class='white-color'>" + percentFormat(1-d.nonWhite_percent) + "</span>/<span class='nonwhite-color'>" + percentFormat(d.nonWhite_percent) + "</span>"
    //       }
    //       return null;
    //     })
    //     .style("line-height",function(d,i){
    //       if (i==0 && (d.nonWhite_percent < .33 || d.nonWhite_percent > .6666665)){
    //         return "10px";
    //       }
    //       return null;
    //     })
    //     ;
    //
    //   disneyBuckets.append("div")
    //     .attr("class","disney-mid-line")
    //     .style("height",function(d){
    //       return d.values.length * 14 + "px";
    //     })
    //     ;
    //
    //   disneyBuckets.append("div")
    //     .attr("class","disney-mid-line-label tk-futura-pt")
    //     .text("50/50")
    //     ;
    //
    //   disneyBuckets.append("div")
    //     .attr("class","disney-bucket-border tk-futura-pt")
    //     ;
    //
    //   disneyBuckets.append("div")
    //     .attr("class","disney-bucket-label tk-futura-pt")
    //     .text(function(d){
    //       if(d.key == "a"){
    //         return "Men have 60%+ Lines"
    //       }
    //       else if (d.key == "b"){
    //         return "race Balance, +/- 10%"
    //       }
    //       return "Women have 60%+ Lines"
    //     })
    //     ;
    // }

    function histogramThree(){
      var width = 700;

      var movieMap = movieData.map(function(d){ return d.nonWhite_percent; })

      var middlePercentile = movieData.filter(function(d){
        return d.nonWhite_percent<0.5;
      }).length;


      var buckets = d3.layout.histogram()
        .bins([0,.1,.4,.6,.9,1])
        (movieMap);

      var maxBuckets = d3.max(buckets, function(d) { return +d.y });
      var bucketsScale = d3.scale.linear().domain([0,movieMap.length]).range([0,400])

      var histogramThreeSpectrum = d3.select(".histogram-three")
        .append("div")
        .attr("class","histogram-three-spectrum")
        .append("div")
        .attr("class","histogram-three-spectrum-data")
        .selectAll("div")
        .data(buckets)
        .enter()
        .append("div")
        .attr("class","histogram-three-spectrum-bucket")
        .style("background-color",function(d){
          return colorScale(d.x);
        })
        .style("width",function(d){
          return bucketsScale(d.y) + "px";
        })
        ;

      d3.select(".histogram-three-spectrum-bucket")
        .style("box-shadow","inset 0 3px 5px rgba(0,0,0,.125)")

      d3.select(".histogram-three")
        .append("p")
        .attr("class","histogram-three-sort tk-futura-pt")
        .html("Sorted by Films with <span class='histogram-three-highlight'>90%+</span> white Lines ")


      d3.select(".histogram-three-spectrum")
        .append("p")
        .attr("class","histogram-three-spectrum-title tk-futura-pt")
        .text("Distribution by Race")
        ;

      d3.select(".histogram-three-spectrum")
        .append("p")
        .attr("class","histogram-three-spectrum-white tk-futura-pt")
        .style("color",whiteColor)
        .text("More Lines from Whites")
        ;

      d3.select(".histogram-three-spectrum")
        .append("p")
        .attr("class","histogram-three-spectrum-nonWhite tk-futura-pt")
        .style("color",nonWhiteColor)
        .text("More Lines from Nonwhites")
        ;

      d3.select(".histogram-three-spectrum-data")
        .append("div")
        .style("left",function(d){
          return bucketsScale(middlePercentile) + "px";
        })
        .attr("class","histogram-three-spectrum-median tk-futura-pt")
        .append("p")
        .attr("class","histogram-three-spectrum-median-text tk-futura-pt")
        .style("color","rgb(78, 77, 77)")
        .text("50/50")
        ;

      var histogramThreeDiv = d3.select(".histogram-three")
        .append("div")
        .attr("class","histogram-three-data")
        .style("width",width+"px")
        ;

      var histogramThreeData = movieData.slice(550,565);

      histogramThreeData = histogramThreeData.sort(function(a, b){
        var o1 = a.nonWhite_percent;
        var o2 = b.nonWhite_percent;

        if (o1 < o2) return 1;
        if (o1 > o2) return -1;
        return 0;
      })

      var histogramThreeRow = histogramThreeDiv.selectAll("div")
        .data(histogramThreeData)
        .enter()
        .append("div")
        .attr("class","histogram-three-row")
        ;

      var rowText = histogramThreeRow.append("p")
        .attr("class","histogram-three-row-text tk-futura-pt")
        .text(function(d){
          if(d.title.length > 18){
            return d.title.slice(0,15)+"...";
          }
          return d.title;
        })
        ;

      var histogramThreeDot = histogramThreeRow.append("div")
        .attr("class","histogram-three-column-container")
        .append("div")
        .attr("class","histogram-three-dot")
        .style("left",function(d){
          return (d.nonWhite_percent)*100+ "%";
        })
        .style("background-color", function(d){
          return colorScaleContinuous(d.nonWhite_percent);
        })
        ;



      d3.select(".histogram-three-row")
        .select(".histogram-three-column-container")
        .append("div")
        .attr("class","histogram-three-axis histogram-three-axis-left")
        .append("p")
        .attr("class","histogram-three-text tk-futura-pt")
        .style("color", function(d){
          return colorScaleContinuous(0);
        })
        .html("100%<br>White Lines");

      d3.select(".histogram-three-row")
        .select(".histogram-three-column-container")
        .append("div")
        .attr("class","histogram-three-axis histogram-three-axis-center")
        .append("p")
        .attr("class","histogram-three-text tk-futura-pt")
        .html("50/50<br>Race Split");

      d3.select(".histogram-three-row")
        .select(".histogram-three-column-container")
        .append("div")
        .attr("class","histogram-three-axis histogram-three-axis-right")
        .style("left",null)
        .append("p")
        .attr("class","histogram-three-text tk-futura-pt")
        .style("color", function(d){
          return colorScaleContinuous(1);
        })
        .html("100%<br>NonWhite Lines")
        ;

    }

    function allFilms(){
      var bucketScale = d3.scale.threshold().domain([0.1,0.4,0.6,0.9,1.1]).range(["a","b","c","d","e"]);
      var bucketsMap = {0:"a",1:"b",2:"c",3:"d",4:"e"}
      var bucketSelected = "a";
      var distributionBarWidth = 300;
      var tooltipOffset = 152;
      var detailChartDataTitleLength = 25;
      var characterNameLength = 14;

      var smallMobile = false;

      if(mobile){
        distributionBarWidth = 200;
        tooltipOffset = 143;
        detailChartDataTitleLength = 19;
        if (viewportWidth < 325) { smallMobile = true; };
        if(smallMobile){detailChartDataTitleLength = 13};
        if(smallMobile){tooltipOffset = 141};
        characterNameLength = 12;
      }
      var width = 700;

      var movieMap = movieData.map(function(d){ return d.nonWhite_percent; })

      var middlePercentile = movieData.filter(function(d){
        return d.nonWhite_percent<0.5;
      }).length;

      var buckets = d3.layout.histogram()
        .bins([0,.1,.4,.6,.9,1])
        (movieMap);

      var bucketText = ["90%+<br>White","60% - 90%<br>White","Race Parity<br>+/- 10%","60% - 90%<br>Nonwhite","90%+<br>Nonwhite"];

      buckets = buckets.map(function(d,i){
        return {y:d.y,dx:d.dx,text:bucketText[i],x:d.x}
      })
      ;

      var sumBuckets = d3.sum(buckets, function(d) { return +d.y });
      var maxPercent = d3.max(buckets, function(d) { return +(d.y/sumBuckets) });
      var scaleBarSize = d3.scale.linear().domain([0,maxPercent]).range([10,200]);
      // var bucketsScale = d3.scale.linear().domain([0,maxBuckets]).range([0,250])

      var distributionColumnContainer = d3.select(".all-films-distribution-container")
        .append("div")
        .attr("class","all-films-distribution-data-container")
        ;

      distributionColumnContainer
        .append("p")
        .attr("class","all-films-distribution-headers")
        .style("left",function(d,i){
          if(mobile){
            return "73px";
          }
          return "0px";
        })
        .text("Count of Films")
        .style("display",function(){
          if(mobile){
            return "none";
          }
          return null;
        })
        ;

      distributionColumnContainer
        .append("p")
        .attr("class","all-films-distribution-headers")
        .style("left",function(d,i){
          if(mobile){
            return null;
          }
          return "266px";
        })
        .style("right",function(d,i){
          if(mobile){
            return "7px";
          }
          return "266px";
        })
        .text("Displayed")
        ;

      var distributionColumn = distributionColumnContainer.append("div")
        .attr("class","all-films-distribution-data")
        ;

      var histogramThreeSpectrum = distributionColumn
        .selectAll("div")
        .data(buckets)
        .enter()
        .append("div")
        .attr("class","all-films-distribution-bucket")

      histogramThreeSpectrum
        .filter(function(d,i){
          return i==0;
        })
        .style("background-color","#F8F9F9")
        ;

      histogramThreeSpectrum
        .append("div")
        .attr("class","all-films-distribution-text")
        .html(function(d){
          return d.text;
        })
        ;

      var distributionBars = histogramThreeSpectrum
        .append("div")
        .attr("class","all-films-distribution-bar")
        .style("background-color",function(d){
          return colorScale(d.x);
        })
        .style("width",function(d){
          return distributionBarWidth*(d.y/sumBuckets) + "px";
        })
        ;

      var distributionAmount = histogramThreeSpectrum
        .append("div")
        .attr("class","all-films-distribution-amount")
        .style("color",function(d){
          if(d.x==0.4){
            return "#222222"
          }
          return colorScale(d.x);
        })
        .html(function(d){
          return d.y + " films";
        })
        ;

      histogramThreeSpectrum
        .append("div")
        .attr("class","all-films-distribution-check")
        .append("input")
        .attr("type","checkbox")
        .attr("class","all-films-distribution-check-box")
        .property("checked",function(d,i){
          if (i==0){
            return true;
          }
          return false;
        })
        ;

      var drawTimeout;

      var filteredBucketData = movieData.filter(function(d,i){

        return bucketScale(d.nonWhite_percent) == bucketSelected;
      })
      ;

      var detailChart = d3.select(".all-films-detail-data-container")
        .append("div")
        .attr("class","all-films-detail-data")
        ;

      var detailChartData = detailChart
        .selectAll("div")
        .data(filteredBucketData.slice(0,19),function(d,i){
          return d.script_id;
        })
        ;

      function detailElementsDraw(){

        var detailChartEnter = detailChartData
          .enter()
          .append("div")
          .attr("class","all-films-detail-film")
          ;

        var firstHover = true;

        detailChartEnter
          .on("mouseover",function(d,i){
            if(firstHover){
              firstHover = false;
              detailChartData
                .filter(function(d,i){
                  return i==0;
                })
                .style("background-color",null)
                .select("div")
                .select("div")
                .selectAll("div")
                .transition()
                .duration(300)
                .style("width",function(d){
                  var totalWords = d3.select(this.parentNode).datum().total_words;
                  return Math.ceil(100*d.words/totalWords)+"px";
                })
                .style("background-color",function(d,i){
                  var filmnonWhitePercent = d3.select(this.parentNode).datum().nonWhite_percent;
                  if(d.race=="w"){
                    return detailScalewhite(1-filmnonWhitePercent);
                  }
                  return detailScalenonWhite(filmnonWhitePercent);
                })
                .style("left",function(d){
                  var totalWords = d3.select(this.parentNode).datum().total_words;
                  var offset = Math.ceil(100*d.offset/totalWords)
                  return offset+"px";
                })
                .style("top",function(d,i){
                  return null;
                })
                ;
            }

            d3.select(this)
              .select("div")
              .select("div")
              .selectAll("div")
              .style("background-color",function(d,i){
                if(d.race=="w"){
                  return whiteColor;
                }
                return nonWhiteColor;
              })
              .transition()
              .duration(300)
              .delay(function(d,i){
                if(d.race == "nw"){
                  return 300+i*30;
                }
                return i*30;
              })
              .style("left",function(d){
                return tooltipOffset + "px";
              })
              .style("top",function(d,i){
                return 13*i + "px";
              })
              ;

            detailToolTip.style("top",function(){
              return 66+25*(i) + "px";
            })
            detailToolTip.style("visibility","visible");

            d3.selectAll(".all-films-detail-tool-tip-row").remove();

            detailToolTipRows = d3.select(".all-films-detail-tool-tip-row-container").selectAll("div")
              .data(characterMap.get(d.script_id).values)
              .enter()
              .append("div")
              .sort(function(a, b){
                return d3.descending(+a.words, +b.words);
              })
              .attr("class","all-films-detail-tool-tip-row")
              ;

            var totalWords = d.total_words;

            detailToolTipRows
              .append("p")
              .attr("class","all-films-detail-tool-tip-amount")
              .text(function(d){
                return commaFormat(Math.round(+d.words));
              })
              .style("margin-right",function(d){
                return "0px";
              })
              .transition()
              .duration(300)
              .delay(function(d,i){
                if(d.race == "nw"){
                  return 300+i*30;
                }
                return i*30;
              })
              .style("margin-right",function(d){
                return 100*(d.words/totalWords)+"px";
              })
              ;

            detailToolTipRows
              .append("p")
              .attr("class","all-films-detail-tool-tip-name")
              .text(function(d){
                if (+d.imdb_character_name.length > characterNameLength){
                  return d.imdb_character_name.slice(0,characterNameLength-2)+"..."
                }
                return d.imdb_character_name;
              })
              ;



          })
          .on("mouseout",function(d){
            d3.select(this)
              .select("div")
              .select("div")
              .selectAll("div")
              .transition()
              .duration(150)
              .style("width",function(d){
                var totalWords = d3.select(this.parentNode).datum().total_words;
                return Math.ceil(100*d.words/totalWords)+"px";
              })
              .style("background-color",function(d,i){
                var filmnonWhitePercent = d3.select(this.parentNode).datum().nonWhite_percent;
                if(d.race=="w"){
                  return detailScalewhite(1-filmnonWhitePercent);
                }
                return detailScalenonWhite(filmnonWhitePercent);
              })
              .style("left",function(d){
                var totalWords = d3.select(this.parentNode).datum().total_words;
                var offset = Math.ceil(100*d.offset/totalWords)
                return offset+"px";
              })
              .style("top",function(d,i){
                return null;
              })
              ;

              detailToolTip.style("visibility","hidden");

          })
          ;

        var detailChartDataTitle = detailChartEnter
          .append("div")
          .attr("class","all-films-detail-film-title-container")
          ;

        detailChartDataTitle.append("p")
          .attr("class","all-films-detail-film-title")
          .text(function(d,i){
            if (d.title.length > detailChartDataTitleLength){
              return d.title.slice(0,detailChartDataTitleLength-2)+"..."
            }
            return d.title;
          })
          .style("color","#F7F7F7")
          .transition()
          .duration(200)
          .delay(function(d,i){
            return i*50;
          })
          .style("color","#000000")
          ;

        var detailScalenonWhite = d3.scale.linear().domain([0,1]).range(["#CCC",nonWhiteColor]);
        var detailScalewhite = d3.scale.linear().domain([0,1]).range(["#CCC",whiteColor]);

        detailChartDataTitle.append("div")
          .attr("class","all-films-detail-film-title-amount")
          .selectAll("div")
          .data(function(d,i){
            return characterMap.get(d.script_id).values;
          })
          .enter()
          .append("div")
          .sort(function(a, b){
            return d3.descending(+a.words, +b.words);
          })
          .attr("class","all-films-detail-film-cast-line-bar")
          .style("width",function(d){
            var totalWords = d3.select(this.parentNode).datum().total_words;
            return Math.ceil(100*d.words/totalWords)+"px";
          })
          .style("background-color",function(d,i){
            var filmnonWhitePercent = d3.select(this.parentNode).datum().nonWhite_percent;
            if(d.race=="w"){
              return detailScalewhite(1-filmnonWhitePercent);
            }
            return detailScalenonWhite(filmnonWhitePercent);
          })
          .style("left",function(d){
            var totalWords = d3.select(this.parentNode).datum().total_words;
            var offset = Math.ceil(100*d.offset/totalWords)
            return offset+"px";
          })
          ;

        detailChartData
          .filter(function(d,i){
            return i==0;
          })
          .style("background-color","#FFF")
          .select("div")
          .select("div")
          .selectAll("div")
          .style("background-color",function(d,i){
            if(d.race=="w"){
              return whiteColor;
            }
            return nonWhiteColor;
          })
          .transition()
          .duration(500)
          .delay(function(d){
            if(d.race == "nw"){
              return 500;
            }
            return null;
          })
          .style("left",function(d){
            return tooltipOffset + "px";
          })
          .style("top",function(d,i){
            return 13*i + "px";
          })
          .style("width",function(d){
            var totalWords = d3.select(this.parentNode).datum().total_words;
            return 100*(d.words/totalWords)+"%";
          })
          ;


        if(filteredBucketData.length < 20){
          detailNext.style("visibility","hidden");
        }
        else{
          detailNext.style("visibility","visible");
        }

      }

      var offsetAmount = 0;

      var detailNext = d3.select(".all-films-detail")
        .append("div")
        .attr("class","all-films-detail-next")
        .append("p")
        .attr("class","all-films-detail-change-text")
        .text("next 20")
        .on("click",function(){
          clearTimeout(drawTimeout);

          offsetAmount = offsetAmount+19;

          detailChartData = detailChartData
            .data(filteredBucketData.slice(offsetAmount,offsetAmount+19),function(d,i){
              return d.script_id + " " + i;
            })
            ;

          detailChartData.exit().remove();

          drawTimeout = setTimeout(function(){
            detailElementsDraw();
            resetToolTip();
          }, 750);

          detailToolTip.style("visibility","visible");
          detailToolTip.style("top",null);

        })
        ;

        detailElementsDraw();

      var detailToolTip = d3.select(".all-films-detail")
        .append("div")
        .attr("class","all-films-detail-tool-tip")

      detailToolTip
        .append("p")
        .attr("class","all-films-detail-tool-tip-title")
        .text("# of Words by Character")

      var detailToolTipRows = detailToolTip
        .append("div")
        .attr("class","all-films-detail-tool-tip-row-container")
        .selectAll("div")
        .data(characterMap.get(filteredBucketData.slice(0,1)[0].script_id).values)
        .enter()
        .append("div")
        .sort(function(a, b){
          return d3.descending(+a.words, +b.words);
        })
        .attr("class","all-films-detail-tool-tip-row")
        ;

      var detailToolTipLines = detailToolTipRows
        .append("p")
        .attr("class","all-films-detail-tool-tip-amount")
        .text(function(d){
          return commaFormat(Math.round(+d.words));
        })
        .style("margin-right",function(d){
          var totalWords = filteredBucketData.slice(0,1)[0].total_words;
          return 100*(d.words/totalWords)+"px";
        })
        ;

      var detailToolTipNames = detailToolTipRows
        .append("p")
        .attr("class","all-films-detail-tool-tip-name")
        .text(function(d){
          if (d.imdb_character_name.length > characterNameLength){
            return d.imdb_character_name.slice(0,characterNameLength-2)+"..."
          }
          return d.imdb_character_name;
        })
        ;

      function searchSpectrum(){

        var searchArray = [];

        var searchInput = d3.select(".search-films-all").select("input")
              .on("keyup", keyupedFilmColumn);

        function keyupedFilmColumn() {
          searchFilmColumn(this.value.trim());
        }

        function searchFilmColumn(value) {
          offsetAmount = 0;
          if (value.length > 2) {

            var re = new RegExp("\\b" + d3.requote(value), "i");

            clearTimeout(drawTimeout);

            filteredBucketData = movieData.filter(function(d,i){
                var string = d.genreList;
                if(genreSelectedAll == "all" && eraSelected == "all"){
                  return d && re.test(d["title"]);
                }
                else if(genreSelectedAll == "all" && eraSelected != "all"){
                  return d.year.slice(2,3) == eraSelected && re.test(d["title"]);
                }
                else if(genreSelectedAll != "all" && eraSelected == "all"){
                  return string.indexOf(genreSelectedAll) > -1 && re.test(d["title"]);
                }
                return string.indexOf(genreSelectedAll) > -1 && re.test(d["title"]) && d.year.slice(2,3) == eraSelected;
              })
              ;

            detailChartData = detailChartData
              .data(filteredBucketData.slice(0,19),function(d,i){
                return d.script_id + " " + i;
              })
              ;

            detailChartData.exit().remove();

            drawTimeout = setTimeout(function(){
              detailElementsDraw();
              resetToolTip();
            }, 500);

            detailToolTip.style("visibility","visible");
            detailToolTip.style("top",null);

          } else{

            clearTimeout(drawTimeout);

            filteredBucketData = movieData.filter(function(d,i){
              var string = d.genreList;
              if (genreSelectedAll == "all" && eraSelected == "all"){
                return d;
              }
              else if(genreSelectedAll == "all" && eraSelected != "all"){
                return d.year.slice(2,3) == eraSelected;
              }
              else if(genreSelectedAll != "all" && eraSelected == "all"){
                return string.indexOf(genreSelectedAll) > -1;
              }
              return string.indexOf(genreSelectedAll) > -1 && d.year.slice(2,3) == eraSelected;

            })
            ;

            detailChartData = detailChartData
              .data(filteredBucketData.slice(0,19),function(d,i){
                return d.script_id + " " + i;
              })
              ;

            detailChartData.exit().remove();

            drawTimeout = setTimeout(function(){
              detailElementsDraw();
              resetToolTip();
            }, 500);

            detailToolTip.style("visibility","visible");
            detailToolTip.style("top",null);

          }

        };
      }

      searchSpectrum();

      function resetToolTip(){

        d3.selectAll(".all-films-detail-tool-tip-row").remove();

        if(filteredBucketData.slice(offsetAmount,offsetAmount + 19).length > 0){

          var topMovie = d3.selectAll(".all-films-detail-film")
            .filter(function(d,i){
              return i == 0;
            })
            .data()
            ;

          detailToolTipRows = d3.select(".all-films-detail-tool-tip-row-container").selectAll("div")
            .data(characterMap.get(topMovie[0].script_id).values)
            .enter()
            .append("div")
            .sort(function(a, b){
              return d3.descending(+a.words, +b.words);
            })
            .attr("class","all-films-detail-tool-tip-row")
            ;

          detailToolTipRows
            .append("p")
            .attr("class","all-films-detail-tool-tip-amount")
            .text(function(d){
              return commaFormat(Math.round(+d.words));
            })
            .style("margin-right",function(d){
              return "0px";
            })
            .transition()
            .duration(300)
            .delay(function(d,i){
              if(d.race == "nw"){
                return 300+i*30;
              }
              return i*30;
            })
            .style("margin-right",function(d){
              var totalWords = filteredBucketData.slice(0,1)[0].total_words;
              return 100*(d.words/totalWords)+"px";
            })
            ;

          detailToolTipRows
            .append("p")
            .attr("class","all-films-detail-tool-tip-name")
            .text(function(d){
              if (d.imdb_character_name.length > characterNameLength){
                return d.imdb_character_name.slice(0,characterNameLength-2)+"..."
              }
              return d.imdb_character_name;
            })
            ;
        }



      }

      function distributionUpdate(){

        var filteredBucketData = movieData.filter(function(d){
          var string = d.genreList;
          if (genreSelectedAll == "all" && eraSelected == "all"){
            return d;
          }
          else if(genreSelectedAll == "all" && eraSelected != "all"){
            return d.year.slice(2,3) == eraSelected;
          }
          else if(genreSelectedAll != "all" && eraSelected == "all"){
            return string.indexOf(genreSelectedAll) > -1;
          }
          return string.indexOf(genreSelectedAll) > -1 && d.year.slice(2,3) == eraSelected;
        })
        ;

        var movieMap = filteredBucketData.map(function(d){ return d.nonWhite_percent; })

        buckets = d3.layout.histogram()
          .bins([0,.1,.4,.6,.9,1])
          (movieMap);

        buckets = buckets.map(function(d,i){
          return {y:d.y,dx:d.dx,text:bucketText[i],x:d.x}
        })
        ;

        sumBuckets = d3.sum(buckets, function(d) { return +d.y });
        var maxPercent = d3.max(buckets, function(d) { return +(d.y/sumBuckets) });
        var scaleBarSize = d3.scale.linear().domain([0,maxPercent]).range([10,200]);

        histogramThreeSpectrum = histogramThreeSpectrum
          .data(buckets)
          ;

        histogramThreeSpectrum
          .select(".all-films-distribution-bar")
          .transition()
          .duration(500)
          .style("width",function(d){
            return distributionBarWidth*((d.y)/sumBuckets) + "px";
          })
          ;

        histogramThreeSpectrum
          .select(".all-films-distribution-amount")
          .html(function(d){
            return d.y + " films";
          })
          ;

      }

      function detailChartUpdate(){

        clearTimeout(drawTimeout);

        filteredBucketData = movieData.filter(function(d,i){
          var string = d.genreList;
          if (genreSelectedAll == "all" && eraSelected == "all"){
            return bucketScale(d.nonWhite_percent) == bucketSelected;
          }
          else if(genreSelectedAll == "all" && eraSelected != "all"){
            return bucketScale(d.nonWhite_percent) == bucketSelected && d.year.slice(2,3) == eraSelected;
          }
          else if(genreSelectedAll != "all" && eraSelected == "all"){
            return bucketScale(d.nonWhite_percent) == bucketSelected && string.indexOf(genreSelectedAll) > -1;
          }
          return bucketScale(d.nonWhite_percent) == bucketSelected && string.indexOf(genreSelectedAll) > -1 && d.year.slice(2,3) == eraSelected;
        })
        ;

        detailChartData = detailChartData
          .data(filteredBucketData.slice(0,19),function(d,i){
            return d.script_id + " " + i;
          })
          ;

        detailChartData.exit().transition().duration(250).style("opacity",0).remove();

        drawTimeout = setTimeout(function(){
          // updateText.remove();
          detailElementsDraw();
          resetToolTip();
        }, 1000);

        detailToolTip.style("visibility","visible");
        detailToolTip.style("top",null);

      }

      d3.selectAll(".all-films-distribution-bucket")
        .on("click",function(d,i){
          offsetAmount = 0;
          var bucketPrevious = bucketSelected;
          if(bucketPrevious != bucketsMap[i]){
            bucketSelected = bucketsMap[i];
            d3.selectAll(".all-films-distribution-bucket").style("background-color",null).select(".all-films-distribution-check").select("input").property("checked",false);
            d3.select(this).style("background-color","#F8F9F9)").select(".all-films-distribution-check").select("input").property("checked",true);
            detailChartUpdate();
          }
        })
        ;

      d3.selectAll(".filter-item-all")
        .on("click",function(d,i){
          offsetAmount = 0;
          var genrePrevious = genreSelectedAll;
          var id = d3.select(this).attr("id");
          if(genrePrevious != id){
            d3.selectAll(".filter-item-all").style("background-color",null).style("box-shadow",null).style("border-color",null).style("font-weight",null);
            d3.select(this).style("background-color","#F5F5F5").style("box-shadow","inset 0 3px 5px rgba(0,0,0,.125)").style("border-color","#adadad").style("font-weight","500");
            genreSelectedAll = id;
            detailChartUpdate();
            distributionUpdate();
          }
        })
        ;

      d3.selectAll(".filter-item-era")
        .on("click",function(d,i){
          offsetAmount = 0;
          var eraPrevious = eraSelected;
          var id = d3.select(this).attr("id");
          if(id=="tens"){
            id=1;
          }
          else if(id=="oughts"){
            id = 0;
          }
          else if(id=="nineties"){
            id = 9;
          }
          else if (id=="eighties"){
            id = 8;
          }
          if(eraPrevious != id){
            d3.selectAll(".filter-item-era").style("background-color",null).style("box-shadow",null).style("border-color",null).style("font-weight",null);
            d3.select(this).style("background-color","#F5F5F5").style("box-shadow","inset 0 3px 5px rgba(0,0,0,.125)").style("border-color","#adadad").style("font-weight","500");
            eraSelected = id;
            detailChartUpdate();
            distributionUpdate();
          }
        })
        ;


    }

    function ageHistogram(){

      var ageMax = {};
      for (var item in ageData){
        var race = ageData[item].key;
        var raceTotal = ageData[item].total_words;
        ageMax[race] = raceTotal;
      }



      ageData = ageData.sort(function(b, a){
        var o1 = a.key;
        var o2 = b.key;

        if (o1 < o2) return -1;
        if (o1 > o2) return 1;
        return 0;
      })
      ;

      var bucketScale = d3.scale.threshold().domain([0.1,0.4,0.6,0.9,1]).range(["a","b","c","d","e"]);
      var bucketsMap = {0:"a",1:"b",2:"c",3:"d",4:"e"}
      var bucketSelected = "a";

      var width = 700;

      for (var raceBucket in ageNest){
        var race = ageNest[raceBucket].key;
        if (ageNest[raceBucket].key != "?"){
          var buckets = d3.layout.histogram()
            .bins([0,21,32,42,65,100])
            .value(function(d){
              if (+d.key > 0 && +d.key < 100){
                return +d.key;
              }
              return null;
            })
            (ageNest[raceBucket].values)
            ;

          for (var item in buckets){
            buckets[item].total = d3.sum(buckets[item], function(d) { return d.values; });
          }
          var totalSum = d3.sum(buckets, function(d) { return d.total; });
          var extent = d3.extent(buckets, function(d) { return d.total/totalSum; });

          var bucketText = ["Under 21<br>years-old","22 to 31","32 to 41","42 to 65","65+<br>years-old"];

          var bucketsScale = d3.scale.linear().domain([0,1]).range([0,300])
          var bucketsColorScale = d3.scale.linear().domain(extent).range([.35,1])

          var ageContainer = d3.select(".age-chart")
            .append("div")
            .attr("class","age-chart-column tk-futura-pt")
            ;

          ageContainer.append("p")
            .attr("class","age-chart-column-title")
            .text(function(d){
              if(race == "w"){
                return "White Actors: Total Words, by Age";
              }
              else if(race == "nw"){
                return "Nonwhite Actors: Total Words, by Age";
              }
            })


          var ageDataHistogram = ageContainer.append("div")
            .attr("class","age-chart-data-container")
            .selectAll("div")
            .data(buckets)
            .enter()
            .append("div")
            .attr("class","age-chart-bucket")
            ;

          var ageBar = ageDataHistogram
            .append("div")
            .attr("class","age-chart-distribution-text")
            .style("line-height",function(d,i){
              if(i==0 || i==(bucketText.length-1)){
                return "14px";
              }
            })
            .html(function(d,i){
              return bucketText[i];
            })
            ;

          var ageBar = ageDataHistogram
            .append("div")
            .attr("class","age-chart-distribution-bar")
            .style("background-color",function(d){
              if(race == "w"){
                return whiteColor;
              }
              else if(race == "nw") {return nonWhiteColor;}
            })
            .style("opacity",function(d,i){
              return bucketsColorScale(d.total/totalSum);
            })
            .style("width",function(d){
              return bucketsScale(d.total/totalSum) + "px";
            })
            .append("p")
            .attr("class","age-chart-distribution-bar-amount")
            .text(function(d,i){
              if(bucketsScale(d.total/totalSum)>55){
                return commaFormat(Math.ceil(d.total/1000000*10)) + "M Words";
              }
              return null;
            })
            ;

          var agePercent = ageDataHistogram
            .append("div")
            .attr("class","age-chart-distribution-percent")
            .text(function(d,i){
              var textrace = "";
              if(race == "w"){
                textrace = "White"
              }
              else if(race == "nw"){
                textrace = "Nonwhite"
              }
              if(i==0){
                return percentFormat(d.total/totalSum) + " of All "+textrace+" Dialogue in Dataset"
              }
              return percentFormat(d.total/totalSum);
            })
            ;


        }
      }


      var margin = {top: 0, right: 0, bottom: 22, left: 0},
          width = 200 - margin.left - margin.right,
          height = 90 - margin.top - margin.bottom;

      var ageChartContainer = d3.select(".age-chart-two");

      var ageChart = ageChartContainer.append("svg")
        .attr("class","age-sprite")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        ;

      var x = d3.scale.linear().domain([1,80]).range([0, width]);
      var y = d3.scale.linear().domain([0,.1]).range([height, 0]);

      var xAxis = d3.svg.axis()
        .scale(x)
        .tickPadding(-4)
        .tickValues([10,20,30,40,50,60,70])
        .orient("bottom");

      var area = d3.svg.area()
        .interpolate("basis")
        .x(function(d) { return x(+d.key); })
        .y0(height)
        .y1(function(d) { return y(d.values/ageMax[d.raceTag]); });

      ageChart.append("g").selectAll("path")
          .data(ageData)
          .enter()
          .append("path")
          .attr("fill", function(d,i){
            if(d.key == "nw"){
              var rgbColor = d3.rgb(nonWhiteColor)
              return "rgba("+rgbColor.r+","+rgbColor.g+","+rgbColor.b+",.3)";
            }
            var rgbColor = d3.rgb(whiteColor)
            return "rgba("+rgbColor.r+","+rgbColor.g+","+rgbColor.b+",.2)";

          })
          .style("stroke", function(d){
            if(d.key == "nw"){
              return nonWhiteColor;
            }
            return whiteColor;
          })
          .attr("class", function(d){
            return "age-area"
          })
          .attr("d", function(d){
            return area(d.values);
            // return area.values;
          })
          ;

      ageChart.append("g")
        .attr("class", "x axis tk-futura-pt")
        .attr("transform", "translate("+margin.left+"," + height + ")")
        .call(xAxis)
        ;

      ageChart.append("g")
        .attr("class", "x-axis-label tk-futura-pt")
        .attr("transform", "translate("+80+"," + (height+18) + ")")
        .append("text")
        .text("years-old")
        ;

    }

    spectrumChart();
    // disneySample();
    histogramThree();
    ageHistogram();
    allFilms();

    d3.select(".embed-text").on("click",function(){
      d3.select(".embed-input")
        .style("display","block")
        .attr("value","<iframe src='https://pudding.cool/2017/03/films/embed.html' frameborder='0'></iframe>")
        ;
      d3.select(this).text("paste this code in your site");
    })
    ;

// _________________________________________________________________________________________________________________________//

//  gross map

  // using d3 for convenience
  var container = d3v4.select('#scroll');
  var graphic = container.select('.scroll__graphic');
  var chart = graphic.select('.gross-chart');
  var text = container.select('.scroll__text');
  var step = text.selectAll('.step');
  // initialize the scrollama
  var scroller = scrollama();

  var buffer = d3v4.select('.step-buffer');

  var svg = chart.append("svg");

  var testWidth;
  var testHeight;

  var isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);

  var gX;
  var gY;
  var xShift;
  var yShift;

  handleResize();

  var grossChart = svg.append("g")
    .attr("transform", "translate(" + testWidth*0.05 + "," + 4 + ")");

  if(isSafari) {
    grossChart.attr("transform", "translate(" + (xShift + 40) + "," + yShift + ")");
  }

  if(mobile) {
    grossChart.attr("transform", "translate(" + 33.5 + "," + 4 + ")");
  }

  var formatX = d3v4.format(".0f");
  var formatY = d3v4.format(".0f");

  var colorValue = function(d) { return colorScale(+d.pct_wht); };
  var interpolateOne = d3v4.interpolate("#3ecdfd","#ddd");
  var interpolateTwo = d3v4.interpolate("#ddd","#fecb45");

  var colorScale = d3v4.scaleLinear()
    .domain([0,0.33,0.5,0.66,1])
    .range(["#3ecdfd",interpolateOne(0.5),"#ddd",interpolateTwo(0.5), "#fecb45"]); 
  
   usGross.forEach(function(d) {
      d.us_gross = +d.us_gross;
      d.pct_wht = +d.pct_wht;
   });

  var max = d3v4.max(usGross, (function (d) {return d.us_gross}));

  if(!mobile) {
    var x = d3v4.scaleLinear()
      .domain([0, d3v4.max(usGross,function (d) { return d.pct_wht })])
      .range([0, testWidth*0.92]);
  } else {
      var x = d3v4.scaleLinear()
        .domain([0, d3v4.max(usGross,function (d) { return d.pct_wht })])
        .range([0, testWidth*0.85]);
    }

  var y = d3v4.scaleLinear()
    .domain([0, max])
    .range([testHeight*0.90, 0]);
    

  var xAxis = d3v4.axisBottom(x)
      .tickSize(0)
      .tickFormat(function(d) { 
        var s = formatX(d*100);
        return this.parentNode.nextSibling  
            ? "\xa0" + s
            : s + "%";
      })
      .ticks(5);

  if(!mobile) {
    var tickLength = testWidth*0.92;
  } else {
    var tickLength = testWidth*0.85;
  }
  

  var yAxis = d3v4.axisRight(y)
      .tickSize(tickLength)
      .tickFormat(function(d) {
        var s = formatY(d / 1e6);
        return this.parentNode.nextSibling
            ? "\xa0" + s
            : "$" + s + " million";
      })
      .ticks(6);

  var xGroup = grossChart.append("g")
      .attr("transform", "translate(0," + testHeight*0.95 + ")")
      .attr("class", "age-chart-distribution-percent tk-futura-pt")
      .call(customXAxis);

  // if(isSafari) {
  //   xGroup.attr("transform", "translate(0," + (chart.node().offsetHeight - 10)*0.83 + ")");
  // }

  var yGroup = grossChart.append("g")
      .attr("class", "age-chart-distribution-percent tk-futura-pt")
      .call(customYAxis);

  var circles = grossChart.selectAll('circle')
      .data(usGross)
      .enter()
    .append('circle')
      .attr('cx',function (d) { return x(+d.pct_wht) })
      .attr('cy',function (d) { return y(+d.us_gross) })
      .attr('r','4')
      .attr('fill', colorValue)
      .attr("fill-opacity", 1);
      // .attr("stroke", "#FFFFFF")
      // .attr("stroke-width", 0.2)
      // .attr("stroke-opacity", 0.3);

  var firstValues = function(d) { return y(+d.us_gross) };
  var trigger = 0;

  var xSeries = usGross.map(function(d) { return parseFloat(d.pct_wht); });
  var ySeries = usGross.map(function(d) { return parseFloat(d.us_gross); });
    
  
  var leastSquaresCoeff = leastSquares(xSeries, ySeries);

  var slope = leastSquaresCoeff[0];
  var intercept = leastSquaresCoeff[1];
  var rSquare = leastSquaresCoeff[2];

  var trendline = grossChart.append("line")
      .attr("x1", x(0.))
      .attr("y1", y(intercept))
      .attr("stroke-opacity", 0.8)
      .attr("stroke-width", 2);

  if(!mobile) {
    trendline
      .attr("x2", x(0.))
      .attr("y2", y(d3v4.max(usGross,function (d) { return d.pct_wht })*slope + intercept))
      .attr("stroke", "#3ecdfd");
  } else {
    trendline
      .attr("stroke", "#505050")
      .attr("x2", x(d3v4.max(usGross,function (d) { return d.pct_wht })))
      .attr("y2", y(d3v4.max(usGross,function (d) { return d.pct_wht })*slope + intercept));
  }

  function customXAxis(g) {
    g.call(xAxis);
    g.select(".domain").remove();
    g.selectAll(".tick text").style("font-size", 13).style("font-weight", 500);
  }

  function customYAxis(g) {
    var s = g.selection ? g.selection() : g;
    g.call(yAxis);
    s.select(".domain").remove();
    s.selectAll("line").attr("stroke", "#777").attr("stroke-opacity", 0.4).attr("stroke-dasharray", "5,4");
    s.selectAll(".tick text").attr("x", -35).attr("dy", -4).style("font-size", 13).style("font-weight", 500);
    if (s !== g) g.selectAll(".tick text").attrTween("x", null).attrTween("dy", null);
  }

  function leastSquares(xSeries, ySeries) {
    var reduceSumFunc = function(prev, cur) { return prev + cur; };
    
    var xBar = xSeries.reduce(reduceSumFunc) * 1.0 / xSeries.length;
    var yBar = ySeries.reduce(reduceSumFunc) * 1.0 / ySeries.length;

    var ssXX = xSeries.map(function(d) { return Math.pow(d - xBar, 2); })
      .reduce(reduceSumFunc);
    
    var ssYY = ySeries.map(function(d) { return Math.pow(d - yBar, 2); })
      .reduce(reduceSumFunc);
      
    var ssXY = xSeries.map(function(d, i) { return (d - xBar) * (ySeries[i] - yBar); })
      .reduce(reduceSumFunc);
      
    var slope = ssXY / ssXX;
    var intercept = yBar - (xBar * slope);
    var rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY);
    
    return [slope, intercept, rSquare];
  }

  // generic window resize listener event
  function handleResize() {
    if( /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
      viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    }

    var smallMobile = false;

    // 1. update height of step elements
    var stepHeight = 158 + 'px';
    step
      .style('height', stepHeight + 'px');
    // 2. update width/height of graphic element
    var bodyWidth = d3v4.select('body').node().offsetWidth;
    graphic
      .style('width', bodyWidth + 'px');
      //.style('height', (container.node().offsetHeight*0.48) + 'px');
    var chartMargin = 32;
    var textWidth = text.node().offsetWidth;
    var chartWidth = 900;
    if(mobile) {
      chartWidth = viewportWidth*0.92;
      if (viewportWidth < 325) { smallMobile = true; };
      if(smallMobile) { chartWidth = 306 };
    }

    var safariWidth = chartWidth;

    if(isSafari) {chartWidth = window.innerWidth;}
    var chartHeight = 370;
    chart
      .style('width', chartWidth + 'px')
      .style('height', chartHeight + 'px');

    if(isSafari) {
      testWidth = safariWidth;
    } else {
      testWidth = chartWidth;
    }
    testHeight = chartHeight;

    // gY = testHeight*0.05;
    // if(!mobile) {
    //   gX = testWidth*0.05;
    // } else {
    //   gX = testWidth*0.15;
    // }

    xShift = Math.floor((window.innerWidth - testWidth) / 2);
    yShift = -30;
    
//     if(mobile) {
//       xShift = Math.floor(window.innerWidth - testWidth);
//       yShift = -60;
//     }

    svg
      .attr('width', chartWidth + 'px')
      .attr('height', chartHeight + 'px');

     if(!isSafari) {
      svg
        .attr('transform', 'translate(' + xShift + ',' + yShift +')');
     } 

    buffer
      .style('height', chartHeight + 'px');
    // 3. tell scrollama to update new element dimensions
    scroller.resize();
  }

  // scrollama event handlers
  function handleStepEnter(response) {
    // response = { element, direction, index }
    // add color to current step only
    step.classed('is-active', function (d, i) {
      return i === response.index;
    })

    if (response.index == 0 && trigger == 1) {

    d3v4.timeout(function() {
      y.domain([0, max]);
      yGroup.transition().duration(1000).call(customYAxis);
      d3v4.selectAll('circle') // move the circles
        .data(usGross)
        .transition().duration(1000)
          .attr('cy',firstValues)
          .attr('r', 4);
          // .attr('stroke', "#505050")
          // .attr('stroke-width', 0.1)
          // .attr('stroke-opacity', 0.4);
      trendline.transition().duration(1000)
          .attr("x1", x(0.))
          .attr("y1", y(intercept))
          .attr("x2", x(d3v4.max(usGross,function (d) { return d.pct_wht })))
          .attr("y2", y(d3v4.max(usGross,function (d) { return d.pct_wht })*slope + intercept))
          .attr("stroke-width", 2);
    }, 0); 

    trigger = 0;
    }

    if (response.index == 1 && trigger == 0) {

    d3v4.timeout(function() {
      y.domain([0, max/10]);
      yGroup.transition().duration(1000).call(customYAxis);
      d3v4.selectAll('circle') // move the circles
        .data(usGross)
        .transition().duration(1000)
          .attr('cy',function (d) { return y(d.us_gross) })
          .attr('r', 6);
          // .attr('stroke', "#505050")
          // .attr('stroke-width', 0.1)
          // .attr('stroke-opacity', 0.4);
      trendline.transition().duration(1000)
          .attr("x1", x(0.))
          .attr("y1", y(intercept))
          .attr("x2", x(d3v4.max(usGross,function (d) { return d.pct_wht })))
          .attr("y2", y(d3v4.max(usGross,function (d) { return d.pct_wht })*slope + intercept))
          .attr("stroke-width", 4);
    }, 0); 

    trigger = 1;
    }
    // update graphic based on step
    // chart.select('p').text(response.index + 1)
  }
  function handleContainerEnter(response) {
    // response = { direction }
    // sticky the graphic (old school)
    graphic.classed('is-fixed', true);
    graphic.classed('is-bottom', false);

    if(trigger == 0) {
      trendline.transition().duration(1).attr("stroke", "#505050")

      trendline.transition().duration(800).attr("x2", x(d3v4.max(usGross,function (d) { return d.pct_wht })))
        .attr("y1", y(d3v4.max(usGross,function (d) { return d.pct_wht })*slope + intercept))
    }

  }
  function handleContainerExit(response) {
    // response = { direction }
    // un-sticky the graphic, and pin to top/bottom of container
    graphic.classed('is-fixed', false);
    graphic.classed('is-bottom', response.direction === 'down');

    if(trigger == 0) {
      d3v4.timeout(function() {
        trendline.transition().duration(800).attr("x2", 0.).attr("y1", y(d3.max(usGross,function (d) { return d.pct_wht })*slope + intercept))
      }, 1000);
    }

  }
  //function init() {
    if(!mobile) {
      // 1. force a resize on load to ensure proper dimensions are sent to scrollama
  //    handleResize();

      // 2. setup the scroller passing options
      // this will also initialize trigger observations
      // 3. bind scrollama event handlers (this can be chained like below)
      scroller.setup({
        container: '#scroll',
        graphic: '.scroll__graphic',
        text: '.scroll__text',
        step: '.scroll__text .step',
      })
        .onStepEnter(handleStepEnter)
        .onContainerEnter(handleContainerEnter)
        .onContainerExit(handleContainerExit);
    }
      // setup resize event
      window.addEventListener('resize', handleResize);

  //}


  // kick things off
  //init();

    // var romComMap = d3.map(romCom,function(d,i){
    //   return d.imdb_id;
    // });
    //
    // console.log(romComMap);
    //
    // console.log(scriptNest);
    // var romComArray = []
    //
    // for (script in scriptNest){
    //   if(romComMap.has(scriptNest[script].imdb_id)){
    //     romComArray.push(scriptNest[script]);
    //   }
    // }
    //
    // console.log(romComArray);
    //
    // console.log(d3.mean(romComArray,function(d,i){return d.nonWhite_percent;}));

    // var whiteLead = 0;
    // var nonWhiteLead = 0;
    //
    // var whiteSupport = 0;
    // var nonWhiteSupport = 0;
    //
    // for (script in characterNest){
    //   nonWhiteCount = 0;
    //
    //   // if(characterNest[script].values[characterNest[script].values.length-1].race == "w"){
    //   //   whiteLead = whiteLead + 1;
    //   // }
    //   if(characterNest[script].values[characterNest[script].values.length-1].race == "nw"){
    //     nonWhiteCount = nonWhiteCount + 1;
    //   }
    //     if(characterNest[script].values[characterNest[script].values.length-2].race == "nw"){
    //       nonWhiteCount = nonWhiteCount + 1;
    //     }
    //     // if(characterNest[script].values[characterNest[script].values.length-2].race == "w"){
    //     //   whiteSupport = whiteSupport + 1;
    //     // }
    //     if(characterNest[script].values.length > 2){
    //       if(characterNest[script].values[characterNest[script].values.length-3].race == "nw"){
    //         nonWhiteCount = nonWhiteCount + 1;
    //       }
    //       // if(characterNest[script].values[characterNest[script].values.length-3].race == "w"){
    //       //   whiteSupport = whiteSupport + 1;
    //       // }
    //     }
    //     if (nonWhiteCount > 1){
    //       nonWhiteSupport = nonWhiteSupport + 1;
    //     }
    // }

  //
  // lineByLine = lineByLine.filter(function(d,i){
  //   return d.script_id  < 4;
  // });

  // var lineArray = [];
  //
  // for (item in lineByLine){
  //   var array = lineByLine[item].line_indexes.split(", ");
  //   for (line in array){
  //     var row = {line_index:array[line],race:lineByLine[item].actor_race, script_id:lineByLine[item].script_id};
  //     lineArray.push(row);
  //   }
  // }
  // //
  //
  // var lineNest = d3.nest()
  //   .key(function(d){
  //     return d.script_id;
  //   })
  //   .sortValues(function(a,b) {
  //     return +a.line_index - +b.line_index;
  //   })
  //   .entries(lineArray);
  //
  //   for (script in lineNest){
  //     var lineBreakdown = {};
  //     for(line in lineNest[script].values){
  //       var minute = Math.ceil((+line+1)/7);
  //
  //       if (minute in lineBreakdown){
  //         if(lineNest[script].values[line].race == "w"){
  //           lineBreakdown[minute][0] = lineBreakdown[minute][0] + 1;
  //         }
  //         else{
  //           lineBreakdown[minute][1] = lineBreakdown[minute][1] + 1
  //         }
  //       }
  //       else{
  //         lineBreakdown[minute] = [0,0];
  //         if(lineNest[script].values[line].race == "w"){
  //           lineBreakdown[minute][0] = 1;
  //         }
  //         else{
  //           lineBreakdown[minute][1] = 1;
  //         }
  //       }
  //
  //     }
  //     var lineData = [];
  //     var minutes = Object.keys(lineBreakdown);
  //     for (minute in minutes){
  //       lineData.push(lineBreakdown[minutes[minute]])
  //     }
  //     var lineString = "";
  //     for (minuteItem in lineData){
  //       // console.log(lineData[minuteItem]);
  //       lineString = lineString + lineData[minuteItem][0];
  //     }
  //     // console.log(lineString);
  //     scriptCsv.push([lineNest[script].key,lineString])
  //   }






    // var lineBreakdown = {};
    //
    // for (var line in valuesLines){
    //   var minute = Math.ceil((+line+1)/14);
    //   if (minute in lineBreakdown){
    //     if(valuesLines[line] == "w"){
    //       lineBreakdown[minute][0] = lineBreakdown[minute][0] + 1;
    //     }
    //     else{
    //       lineBreakdown[minute][1] = lineBreakdown[minute][1] + 1
    //     }
    //   }
    //   else{
    //     lineBreakdown[minute] = [0,0];
    //     if(valuesLines[line] == "w"){
    //       lineBreakdown[minute][0] = 1;
    //     }
    //     else{
    //       lineBreakdown[minute][1] = 1;
    //     }
    //   }
    // }
    //
    // var lineData = [];
    // var minutes = Object.keys(lineBreakdown);
    // for (minute in minutes){
    //   lineData.push(lineBreakdown[minutes[minute]])
    // }


    // //lines_data.csv
    // });
    // //rom-com.csv
    });

    //genre_mapping.csv
    });
  // //master.csv
  // });
//character-list.csv
});
//meta-data.csv
});
//meta-data.csv
});
}

drawHistogram();

// function save(){
//
//   csvContent = "data:text/csv;charset=utf-8,";
//   scriptCsv.forEach(function(infoArray, index){
//      dataString = infoArray.join(",");
//      csvContent += dataString + "\n";
//   });
//   console.log("finished");
// }
