'use strict';

/* Controllers */
angular.module('myApp.controllers', [])
  .controller('MembersController', ['$scope', '$routeParams', function($scope,$routeParams) {

		//All Dimensions and Measures
		$scope.sabha = $routeParams.loksabha;
		$scope.dataCount = 0;
	  	$scope.dimensions  = ['Party', 'State', 'Education', 'Age', 'Gender' ];
	  	$scope.measures = ['Seats', 'Debates', 'Questions', 'Attendance'];

		//initialize selections
	  	$scope.dimension1 = $scope.dimensions[0];
	  	$scope.dimension2 = $scope.dimensions[1];
	  	$scope.measure = $scope.measures[0];

		//load CSV data
	  	$scope.membersData = [];

		d3.csv("data/"+ $routeParams.loksabha +".csv", function(error, members){
			$scope.membersData = members;
			$scope.renderPage();
		});

		//user selection
		$scope.setDimension1 = function(x){
	  		$scope.dimension1 = x;
	  		$scope.renderPage();
		}
		$scope.setDimension2 = function(x){
	  		$scope.dimension2 = x;
	  		$scope.renderPage();
		}
		$scope.setMeasure = function(x){
			$scope.measure = x;
	  		$scope.renderPage();
		}

		$scope.renderPage = function(){
			var dimensionRingChart = dc.pieChart("#chart-ring-dimension1"),
				measureHistChart = dc.lineChart("#chart-hist-measure"),
				measureRowChart = dc.rowChart("#chart-row-dimension2");

			// normalize/parse data
			$scope.membersData.forEach(function(d) {
				//set measure
				if($scope.measure == 'Seats'){
					d.Measure = 1.0;
				}else{
					//d[$scope.measure] = d[$scope.measure].match(/\d+/);
					d.Measure = +d[$scope.measure];
				}
			});

			//console.log($scope.membersData);

			// set crossfilter
			var ndx = crossfilter($scope.membersData)
			,	dimension1Dim = ndx.dimension(function(d) {
				return d[$scope.dimension1];
			}),	dimension2Dim = ndx.dimension(function(d) {
				return d[$scope.dimension2];
			}), measureDim = ndx.dimension(function(d) {
				return d.Measure;
			}), groupByDimension1 = dimension1Dim.group().reduceSum(function(d) {
				return Math.floor(+d.Measure);
			}), groupByDimension2 = dimension2Dim.group().reduceSum(function(d) {
				return Math.floor(+d.Measure);
			}), measureHist = measureDim.group().reduceCount();

			//additional filters
			var monthsDimension = ndx.dimension(function (d) {
				var d = new Date(Date.parse(d['Event Start Date']));
				return d; //d.getMonth();
			});

			var eventsByMonthGroup = monthsDimension.group().reduceCount();
			//console.log(eventsByMonthGroup.all());

			var monthlyMeasureGroup = monthsDimension.group().reduceSum(function (d) {
				return Math.abs(d.Measure);
			});
			//console.log(monthlyMeasureGroup.all());

			var measureAvgByMonthGroup = monthsDimension.group().reduce(
				function (p, v) {
					++p.days;
					p.total += v.Measure;
					p.avg = Math.round(p.total / p.days);
					//console.log(p);
					return p;
				},
				function (p, v) {
					--p.days;
					p.total -= v.Measure;
					p.avg = p.days ? Math.round(p.total / p.days) : 0;
					//console.log(p);
					return p;
				},
				function () {
					return {days: 0, total: 0, avg: 0};
				}
			);

			$scope.dataCount = ndx.groupAll().reduceCount().value();
			$scope.dimension1Count = dimension1Dim.group().size();
			$scope.dimension2Count = dimension2Dim.group().size();
			$scope.$apply();

			//Charts
			dimensionRingChart.width(500).height(220).dimension(dimension1Dim).group(
					groupByDimension1).innerRadius(50);//legend(dc.legend());

			measureHistChart.renderArea(true).width(600).height(300).dimension(measureDim)
					.group(measureHist).x(d3.scale.linear().domain([ 0, 100 ])).elasticX(true)
					.elasticY(true).margins({top: 20, right: 20, bottom: 40, left: 30})
					.yAxisLabel("Members").xAxisLabel($scope.measure);

			measureHistChart.xAxis().tickFormat(function(d) {
				return d
			});
			measureHistChart.yAxis().tickFormat(function(d) {
				return d
			});
			//filter by dimension1 and dimension2
			measureRowChart.width(600).height(800).dimension(dimension1Dim).group(
					groupByDimension2).elasticX(true);

			dc.renderAll();
		};

  }])
  .controller('MyCtrl2', ['$scope', function($scope) {

  }]);
