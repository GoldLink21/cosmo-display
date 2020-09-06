 /*
 For future classes in case they need to fix or update anything, read this

 The Firebase database uses objects to reference parts of the database
 As such, to set any data you need to create this object. I simply do

 var o={}
 o[uniqueUserId+'part/Im/Trying/To/Access']=value
 ref.update(o)

 Where the part I'm trying to acces would be either the student calendar, their first and last name,
 the period range they are in, or thir year.

 Anytime you want to access the data in the database, you have to do a screenshot of what it has now

 //This lets you see the data once
 userRef.once('value',snapshot=>{
     //First get the values from the snapshot
     var val=snapshot.val()
     //val is an object that has all the values of the database in it. I tend to reference them with 
     // the other syntax of val['partToReference']

     for(var reference in val){
        //reference is the unique reference for each student
        val[reference]//This is the students data
     }

 })
 
 The students array holds a local instance of all the students on the database and updates whenever 
 the database changes. The difference between using the database and the array is that the values
 of the array hold the student's data, and their unique reference to the database

 //This is the format of all objects in the students array
 students[0] === { stu:ThisWouldBeTheStudent, ref:'This is the students reference as a string'}
 
 students[0].stu === { 
     firstName:"Something", 
     lastName:"Something", 
     min:"20",
     hasUpdatedTime:true||false,
     period:"1",
     year:"2",
     calendar:[
         0:{date:DateObject,min:"10"},
         1:{date:DateObject,min:"10"}
     ]
  }
 
 You may want to research destructuring parameters as well as I use that in some parts of the code

 //This is the general layout for destructuring
 function findStusWith({firstName,lastName,min,period}={}){ //You set the object param to an empty
                                                           // object in case you forget to pass in anything
     //The {} in the parameters means you would pass in an object with those properties
 }
 //You would call this as such
 findStuWith({firstName:'Bob',lastName:'Smith'})
 //You can leave out some parameters then and include specific ones. I could skip first and last name too
 findStusWith({min:10})


 ADD VARIABLES FOR CALENDARDATE and CURRENT DATE
 */

 const USERS = {
     'admin': 'admin'
 };

 const Time = {
     /**Returns the time in minutes from hours and minutes */
     toMin(hour = 0, min = 0) {
         return (parseInt(hour) * 60) + parseInt(min)
     },
     /**Returns an object with hour and min holding the times from the minutes passed in*/
     toHours(min = 0) {
         return {
             hour: Math.floor(min / 60),
             min: min % 60
         }
     }
 };

 /**Time needed until they have all time */
 const MinutesNeeded = Time.toMin(1500);
 /**This is the max amount of extra time they can get */
 const MaxExtra = Time.toMin(150);

 var ref = firebase.app().database().ref();
 /**Allows referencing the users quicker */
 var userRef = ref.child('users');

 var students = [];

 /**Allows case sensitive and case insensitive equlity checking */
 function strEqual(s1, s2, isCaseSensitive = false) {
     return (isCaseSensitive) ? s1 === s2 : s1.toLowerCase() === s2.toLowerCase()
 }

 /**Takes a date string and uses it to make an object with minutes */
 function date(dateString, min, extra = 0) {
     return {
         date: new Date(dateString).toDateString(),
         min: min,
         extra: extra
     }
 }

 function findStusWith({
     firstName,
     lastName,
     period,
     minMin,
     minMax,
     year
 } = {}) {
     return students.filter(stuAndRef => {
         var stu = stuAndRef.stu;

         var fn = firstName === undefined || stu.firstName.includes(firstName),
             ln = lastName === undefined || stu.lastName.includes(lastName),
             sMin = parseInt(stu.min),
             minLess = minMin === undefined || sMin >= minMin,
             minMore = minMax === undefined || sMin <= minMax,
             years = year === undefined || parseInt(stu.year) == parseInt(year);
         periods = period === undefined || parseInt(stu.period) == parseInt(period);

         return fn && ln && minLess && minMore && years && periods
     })
 }

 async function removeByRef(stu) {

     if (stu.endsWith('/')) {
         stu = stu.substr(0, stu.length - 1)
     }

     if (!stu.startsWith("users/"))
         stu = 'users/' + stu;
     //If you pass in stu and ref
     if (confirm("ARE YOU SURE YOU WANT TO DELETE THIS STUDENT?")) {
         await ref.child(stu).remove((error) => console.log(error))
         updateAll();
         openTab1();
     } else {

     }

 }

 var calendarStudent = '',
     calendarDate = new Date();

 var correction = false;

 var addingId = 1;

 function addToTable(stu) {

     var row = document.createElement('tr');

     function addToRow(s) {
         var ele = document.createElement('td');
         ele.innerHTML = s;
         row.appendChild(ele);
         return ele;
     }

     function addToRowInput() {
         var td = document.createElement('td');
         td.classList.add('all');

         /**@returns {HTMLElement} */
         function e(elementType, id, type, ...classes) {
             var ele = document.createElement(elementType);
             if (id !== undefined)
                 ele.id = id;
             classes.forEach(clas => ele.classList.add(clas));
             if (elementType === 'input') {
                 ele.setAttribute('type', type);
                 if (type === 'number') {
                     ele.setAttribute('value', '0');
                     ele.setAttribute('min', 0)
                 }
             }
             return ele;
         }

         var but = e("button", "SubmitHrs" + addingId, undefined, "SubmitHrs");
         addingId++;
         but.innerHTML = "Select Student";
         but.setAttribute("data-ref", stu.ref);
         but.onclick = async function () {

             calendarStudent = stu.ref;
             openLoadTab();
             await loadAllCalendar(new Date().getMonth(), new Date().getFullYear());
             openTab2()
         };
         row.appendChild(td);
         td.appendChild(but);

     }
     var table = document.getElementById('stuView');

     addToRow(stu.lastName + ",  " + stu.firstName).classList.add('stuName');

     var t = Time.toHours(stu.min + stu.extra);

     function parsePeriod(prd) {
         if (prd == 1)
             return '1-4';
         else if (prd == 2)
             return '5-7';
         else return 'Unknown periods'
     }

     function parseYear(year = 0) {
         if (year == 1)
             return '1st';
         else if (year == 2)
             return '2nd';
         //Just in case for debugging
         else if (year == 3)
             return '3rd';
         else
             return year + 'th'
     }

     function getTime() {
         var minNeed = Time.toHours(MinutesNeeded - stu.min - stu.extra);
         var str = t.hour + ' hours, ' + t.min + ' minutes <br> <div>To go: ' + minNeed.hour + ':';
         if (minNeed.min.toString().length === 1)
             str += ('0' + minNeed.min);
         else
             str += minNeed.min;

         str += '</div>';
         return str
     }
     /////////////////////////////////////////////////////////Maybe swap positions
     addToRow(parseYear(stu.year)).classList.add('stuYear');
     addToRow(parsePeriod(stu.period)).classList.add('stuPeriod');
     addToRow(getTime()).classList.add('dropDown', 'stuTime');
     addToRowInput();

     table.appendChild(row)
 }

 function remove() {
     removeByRef(calendarStudent);
 }

 function addAll() {
     let index = 1;
     //Grab all the ones with inputs
     Array.from(document.getElementsByClassName('hasInputs'))
         //And filter down to the inputs only
         .map(e => Array.from(e.children[2].querySelectorAll('input')))
         .forEach(e => {
             var dateNum = Number(e[0].parentElement.parentElement.parentElement.firstElementChild.innerText),
                 hr,
                 min;
             var split = e[0].value.split('.');
             if (split.length === 1) {
                 hr = Number(split[0]);
                 min = 0;
             } else {
                 hr = Number(split[0]);
                 if (split[1].length === 1) {
                     split[1] = split[1] + "0";
                 }
                 min = Number(split[1]);
             }

             if (hr !== 0 || min !== 0) {
                 var dateCopy = new Date(calendarDate);
                 dateCopy.setDate(dateNum);
                 var dateObj = date(dateCopy.toDateString(), Time.toMin(hr, min), 0);
                 setDateWithRef(calendarStudent, dateObj);
                 e[0].value = '0';
             }
             index++
         });

     loadAllCalendar(calendarDate.getMonth(), calendarDate.getFullYear());
 }

 /**Loads in all dates on the calendar */
 async function loadAllCalendar(month, year) {
     if (month === undefined) {
         month = new Date().getMonth()
     }
     var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

     var first = new Date();
     first.setDate(1);
     first.setMonth(month);

     if (year)
         first.setFullYear(year);

     //Gets the day that the month starts on. E.g. Monday = I think 1
     //This is so the calendar starts on the correct day
     var firstDayOfMonth = first.getDay();

     calendarDate = new Date(first);

     document.getElementById("month").innerHTML = months[first.getMonth()] + ' ' + first.getFullYear();
     var stu = ref.child(calendarStudent);
     var fn, ln, min, extra;

     await stu.once('value', snap => {
         var val = snap.val();
         fn = val['firstName'];
         ln = val['lastName'];
         min = val['min'];
         extra = val['extra'];
     });
     var stuTime = Time.toHours(min + extra);
     document.getElementsByClassName("NameOnCal")[0].innerHTML = fn + ' ' + ln + "<div class='hidden onlyStudent'>Total Time: " + stuTime.hour + " hours and " + stuTime.min + " minutes. <br>Extra Time: " + Time.toHours(extra).hour + " hours and " + Time.toHours(extra).min + " minutes. </div>";

     var allEle = Array.from(document.getElementsByClassName('allDays'));

     allEle.forEach(e => {
         e.innerHTML = '';
         e.classList.remove('hasInputs')
     });
     var lastDayOfMonth = new Date(first);
     lastDayOfMonth.setMonth(month + 1);
     lastDayOfMonth.setDate(0);
     for (let i = firstDayOfMonth; i < lastDayOfMonth.getDate() + firstDayOfMonth; i++) {
         var span = document.createElement('div');
         span.classList.add("gacha");
         var curDay = i - firstDayOfMonth + 1;

         if (!allEle[i].classList.contains('sunday')) {
             span.innerHTML = curDay.toString();
             allEle[i].appendChild(span);
             allEle[i].appendChild(document.createElement('br'));
         }

         if (allEle[i].classList.contains('Days')) {
             allEle[i].classList.add("hasInputs");
             var prevTime = undefined;
             await stu.child('calendar').once('value', snap => {
                 let val = snap.val();
                 var currentDate = new Date(calendarDate);
                 currentDate.setDate(i - firstDayOfMonth + 1);
                 currentDate = currentDate.toDateString();
                 if (val[currentDate]) {
                     prevTime = val[currentDate]
                 }
             });

             var b1 = document.createElement('div');
             b1.classList.add('block1');

             //CREATES HOURS AND MINS INPUT BOXES
             var d1 = document.createElement('div');
             d1.innerHTML = 'Time:';
             d1.classList.add("noStudent");


             var i1 = document.createElement('input');
             i1.type = 'number';
             i1.min = '0';
             i1.placeholder = '0';
             i1.classList.add('resize');
             i1.classList.add('noStudent');


             var d2 = document.createElement('div');
             d2.innerHTML = 'Entered: ';
             var curHourAndMin = undefined;
             if (prevTime && prevTime.min) {
                 curHourAndMin = Time.toHours(Number(prevTime.min) + Number(prevTime.extra));
                 d2.innerHTML += `<span >${curHourAndMin.hour}</span>.`
             }
             if (curHourAndMin !== undefined) {
                 let minutes = curHourAndMin.min;
                 if (curHourAndMin.min < 10) {
                     minutes = "0" + curHourAndMin.min
                 }
                 d2.innerHTML += "<span >" + minutes + "</span>";
             }
             d2.classList.add('studentOutput');

             //CREATE EXTRA TIME CHECKBOX
             var d3 = document.createElement('div');

             d3.innerHTML += '&nbsp;';
             if (correction === false) {
                 d3.classList.add('hidden');
             }
             var btn1 = document.createElement('button');
             btn1.innerHTML = 'Set Time';
             btn1.tabIndex = -1;

             function addEvent(button, in1, in3, thisDate) {
                 button.addEventListener('click', async event => {
                     var hr,
                         min;

                     var split = in1.value.split('.');
                     if (split.length === 1) {
                         hr = Number(split[0]);
                         min = 0;
                     } else {
                         hr = Number(split[0]);
                         if (split[1].length === 1) {
                             split[1] = split[1] + "0";
                         }
                         min = Number(split[1]);
                     }

                     var dateToAdd = date(thisDate, Time.toMin(hr, min), 0);

                     await loadAllCalendar(calendarDate.getMonth(), calendarDate.getFullYear());
                     setDateWithRef(calendarStudent, dateToAdd);
                 })
             }
             var thisDate = new Date(first);
             thisDate.setDate(Number(curDay));
             addEvent(btn1, i1, d3.querySelector('input'), thisDate.toDateString(), prevTime);
             d3.appendChild(btn1);
             d1.appendChild(i1);
             b1.appendChild(d1);
             b1.appendChild(d2);
             b1.appendChild(d3);
             allEle[i].appendChild(b1);
         }
     }
 }

 function loadNextMonth() {
     if (isStudentCalendar) {
         var nDate = new Date(calendarDate);
         nDate.setMonth(nDate.getMonth() + 1);
         loadStudentCalendar(calendarStudent, nDate.getMonth(), nDate.getFullYear())
     } else {
         calendarDate.setMonth(calendarDate.getMonth() + 1);
         loadAllCalendar(calendarDate.getMonth(), calendarDate.getFullYear())
     }
 }

 function loadPrevMonth() {
     if (isStudentCalendar) {
         var nDate = new Date(calendarDate);
         nDate.setMonth(nDate.getMonth() - 1);
         loadStudentCalendar(calendarStudent, nDate.getMonth(), nDate.getFullYear())
     } else {
         calendarDate.setMonth(calendarDate.getMonth() - 1);
         loadAllCalendar(calendarDate.getMonth(), calendarDate.getFullYear())
     }
 }

 function getNextStudentOnCalendar() {
     var arr = Array.from(document.getElementsByClassName('SubmitHrs'));
     var i = arr.findIndex(e => {
         return e.dataset['ref'] === calendarStudent
     });
     if (i === arr.length - 1)
         return arr[0].dataset['ref'];
     return arr[i + 1].dataset['ref']
 }

 function getPrevStudentOnCalendar() {
     var arr = Array.from(document.getElementsByClassName('SubmitHrs'));
     var i = arr.findIndex(e => {
         return e.dataset['ref'] === calendarStudent
     });
     if (i === 0)
         return arr[arr.length - 1].dataset['ref'];
     return arr[i - 1].dataset['ref']
 }

 var filters = {};

 function filterChangePeriod() {
     var val = document.getElementById('periodFilter').value;
     if (val !== 'all')
         filters.period = val;
     else
         delete filters.period;

     clearTable();
     studentInit()
 }

 function filterChangeYear() {
     var val = document.getElementById('yearFilter').value;
     if (val !== 'all')
         filters.year = val;
     else
         delete filters.year;

     clearTable();
     studentInit()
 }

 function sortStus() {
     var stus = findStusWith(filters);

     var y1 = stus.filter(stu => stu.stu.year == 1),
         y2 = stus.filter(stu => stu.stu.year == 2);

     return y1.sort(byName).concat(y2.sort(byName));

     function byName(a, b) {

         a = a.stu;
         b = b.stu;

         var ret = Number(a.year) - Number(b.year);

         if (a.lastName > b.lastName)
             return 1; //+ret;
         else if (a.lastName < b.lastName)
             return -1; //+ret

         if (a.firstName < b.firstName)
             return -1; //+ret;
         else if (a.firstName > b.firstName)
             return 1; //+ret;
         else
             return 0 //+ret
     }
 }

 /**Goes through every student and tallies up their calendar's minutes to update the running total minutes */
 function tallySingleStu(studentRef) {
     var stuRef = ref.child(studentRef);
     var totalM = 0;
     stuRef.child('calendar').once('value', snapCal => {
         var calVal = snapCal.val();
         for (cRef in calVal) {
             totalM += Number(calVal[cRef].min)
         }
     });
     stuRef.update({
         min: totalM,
         hasUpdatedTime: false
     })
 }

 /**Adds all students from the database to the local students array */
 async function studentInit() {
     openLoadTab();
     students = [];
     addingId = 1;
     ref.once('value', (snapshot) => {
         var val = snapshot.val();
         for (p1 in val) {
             for (p2 in val[p1]) {
                 //Adds all the students to the table
                 students.push({
                     ref: p1 + '/' + p2 + '/',
                     stu: val[p1][p2]
                 })
             }
         }
     }).then(() => {
         sortStus().forEach(stu => addToTable(stu.stu));
         openTab1()
     })
 }

 /**Just a debugging function to confirm access to the database */
 /*function listStudentsInConsole(){
     userRef.orderByChild('lastName').once('value',function(snapshot){
         var val = snapshot.val();
         for(part in val)
             console.log(val[part])
     },(errorObject)=>{
         console.log('Read Failed: '+errorObject.code)
     })
 }*/

 /**
  * @description Adds a new student to the students array. Called from the HTML
  * @param {string} firstName The student's first name
  * @param {string} lastName The student's last name
  * @param {number} curHours The current ammount of hours the student has
  * @param {number} curMins The current ammount of minutes out of an hour the student has
  * @param {1|2} classPeriod The 1st period that the student has the class
  * @param {1|2} year The year the student is enrolled in. 1 || 2
  */
 async function addStudent(firstName, lastName, classPeriod, year, curHours = 0, curMins = 0) {
     var hasData = (firstName !== undefined && firstName !== '' && lastName !== undefined && lastName !== '' && classPeriod !== undefined && year !== undefined),
         dataGood = (/^[1-2]{1}$/.test(classPeriod) && /[1-2]{1}$/.test(year) && parseInt(classPeriod) === parseFloat(classPeriod) && parseInt(year) === parseFloat(year));
     if (hasData && dataGood) {
         var date = today(Time.toMin(curHours, curMins));
         var stu = {
             firstName: firstName,
             lastName: lastName,
             year: year,
             /**This is the total minutes the student has. Gets converted to hours and min */
             min: Time.toMin(curHours, curMins),
             extra: 0,
             /**This will hold all the dates along with the time for that date. Adding to them will be with the date() func */
             calendar: {},
             period: classPeriod,
             hasUpdatedTime: false
         };
         stu.calendar[date.date] = {
             min: date.min,
             extra: date.extra
         };
         userRef.push(stu);

         addCompletedWindow(firstName, lastName);
         addToTable(stu);
         addRefsToStus();
         updateAll();
         return true;
     } else {
         if (!hasData)
             alert("Please enter all the requested data");
         else
             alert("Make sure all inputs are within range");
         return false;
     }
 }

 function addRefsToStus() {
     userRef.once('value', (snapshot) => {
         var val = snapshot.val();
         var o = {};
         for (let nRef in val) {
             if (val[nRef].ref === undefined) {
                 o[nRef + '/ref'] = "users/" + nRef
             }
         }
         if (Object.keys(o).length !== 0)
             userRef.update(o)
     })
 }
 ////////////////////////////////////////////////////////////////////////////////////////////
 ////////////////////////////////////////////////////////////////////////////////////////////
 ////////////////////////////////////////////////////////////////////////////////////////////
 ////////////////////////////////////////////////////////////////////////////////////////////
 /**@param {string} stu */
 function setDateWithRef(stu, dateAndMin) {
     if (stu.endsWith('/')) {
         stu = stu.substr(0, stu.length - 1)
     }

     if (!stu.startsWith("users/"))
         stu = 'users/' + stu;

     var newRef = ref.child(stu);

     var calendar = newRef.child('calendar');
     calendar.child(dateAndMin.date).update({
         min: dateAndMin.min,
         extra: dateAndMin.extra
     })

     newRef.child('hasUpdatedTime').set(true);

     tallySingleStu(stu)
 }

 function setExtraTime() {
     var inputElement = document.getElementById("inputExtraTime");
     var stuRef = ref.child(calendarStudent);

     var minutesToSet;
     if (inputElement.value === "") {
         alert("Please input a value for the extra hours");
         return;
     }
     if (inputElement.value.includes(".")) {
         let split = inputElement.value.split(".");
         if (split[1].length === 1) {
             split[1] = split[1] + '0';
         }
         minutesToSet = Time.toMin(split[0], split[1]);
     } else {
         minutesToSet = Time.toMin(Number(inputElement.value));
     }
     stuRef.once('value', snap => {
         var val = snap.val();
         stuRef.child("extra").set(Number(val.extra) + minutesToSet);
     });

     document.getElementById("extraMenu").classList.toggle('hidden');
     document.getElementById("inputMenu").classList.add('hidden');
     inputElement.value = "";

 }

 function removeExtraTime() {
     if (confirm("Are you sure you want to remove all of this student's extra time?")) {
         ref.child(calendarStudent).child("extra").set(0);
     }
     document.getElementById("extraMenu").classList.toggle('hidden');
     document.getElementById("inputMenu").classList.add('hidden');
 }

 function today(min, extra = 0) {
     return date(new Date().toDateString(), min, extra)
 }

 var completedWindowTimeout = 0,
     newWindow = false;
 const completedWindowTimeoutMax = 100;

 /**Adds a window showing the name of the student that was last added */
 function addCompletedWindow(first, last) {
     var ele = document.getElementById('addedStudent');
     ele.innerHTML = first + ' ' + last + ' was added successfully';
     ele.style.visibility = 'visible';
     newWindow = true
 }

 function eleInit() {
     document.getElementById('newStudent').style.visibility = 'hidden';
     document.getElementById('RemoveStu').style.visibility = 'visible'
 }

 function doCorrections() {
     if (correction === false) {
         correction = true
     } else
         correction = false;

     loadAllCalendar(calendarDate.getMonth(), calendarDate.getFullYear());
 }

 function extraMenu() {
     document.getElementById("extraMenu").classList.toggle('hidden');
     document.getElementById("inputMenu").classList.add('hidden');
     document.getElementById("clearExtraTime").classList.remove('hidden');

     var stuRef = ref.child(calendarStudent);

     stuRef.once('value', snap => {
         var val = snap.val();
         let extraTime = Time.toHours(val.extra);
         let minFloat = extraTime.min / 100;
         let minutes = (minFloat + "").split('.')[1];
         if (minutes === undefined) {
             minutes = '0';
         }
         document.getElementById("curExtraTime").innerHTML = "Extra Time Given: " + extraTime.hour + "." + minutes;
     })
 }

 function addMenu() {
     document.getElementById("inputMenu").classList.toggle('hidden');
     document.getElementById("clearExtraTime").classList.toggle('hidden');
 }


 /**Opens and closes the new student window */
 function toggleNewStudentWindow() {
     var newStu = document.getElementById('newStudent');
     var stuBtn = document.getElementById('studentBtn');
     switch (newStu.style.visibility) {
         case 'visible':
             newStu.style.visibility = 'hidden';
             stuBtn.style.visibility = 'visible';
             break;
         case 'hidden':
             newStu.style.visibility = 'visible';
             stuBtn.style.visibility = 'hidden';
             break
     }
 }

 /**Opens and closes the remove student window */
 function toggleRemoveStudentWindow() {
     var btn = document.getElementById('RemoveStu');
     var window = document.getElementById('RemoveMenu');
     switch (btn.style.visibility) {
         case 'visible':
             btn.style.visibility = 'hidden';
             window.style.visibility = 'visible';
             break;
         case 'hidden':
             btn.style.visibility = 'visible';
             window.style.visibility = 'hidden'

     }
 }

 /**Removes the new student window after a time */
 var completedTimeout = setInterval(() => {
     if (newWindow && completedWindowTimeout < completedWindowTimeoutMax)
         completedWindowTimeout++;
     else {
         completedWindowTimeout = 0;
         newWindow = false;
         document.getElementById('addedStudent').style.visibility = 'hidden'
     }
 }, 60);

 /**Gets rid of all elements in the table aside from the header */
 function clearTable() {
     var div = document.getElementById('listView');
     var table = div.querySelector('table');
     var rows = table.querySelectorAll('tr');
     for (let i = 1; i < rows.length; i++) {
         table.removeChild(rows[i])
     }
 }


 /**I keep this here in case I need to update more than just the table when the database changes */
 function updateAll() {
     updateTable()
 }

 function updateTable() {
     clearTable();
     studentInit()
 }

 var overrideAskRemove = false;

 /**Removes all students that are year 2 and moves all year 1 students to 2 */
 async function removeYear2() {
     if (confirm('Are you sure you want to remove all year 2 students?') && confirm('Are you really sure?')) {
         overrideAskRemove = true;
         userRef.once('value', snap => {
             snap.forEach(val => {
                 var key = 'users/' + val.key;
                 var stu = val.val();
                 if (stu.year === "2") {
                     ref.child(key).remove()
                 } else {
                     ref.child(key).child('year').set("2")
                     ref.child(key).child('period').set("2")
                 }
             })
         });
         updateAll();
         overrideAskRemove = false
     }
 }

 /**This is an offline copy of the database updated every time the database changes */
 var o;
 userRef.on('value', function (snap) {
     o = snap.val()
 });

 function SignIn() {
     let errEle = document.getElementById('loginError');
     var provider = new firebase.auth.GoogleAuthProvider();
     firebase.auth().signInWithPopup(provider).then(function (result) {
         let gUser = result.user;
         //Swap for comercial and display use ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
         //if(gUser.email === "jlaw@warren.k12.in.us" || gUser.email === "lsummei1@warren.k12.in.us" || gUser.email === "dhert@warren.k12.in.us"){
         if (true) {
             errEle.innerHTML = '';
             openTab1();
             document.getElementById('logIn').style.display = 'none';
             studentInit();
         } else {
             loadStudentCalendarByName(gUser.displayName.split(" ")[0], gUser.displayName.split(" ")[1], new Date().getMonth(), new Date().getFullYear());
         }
     }).catch(function (error) {
         // Handle Errors here.
         var errorMessage = error.message;
         errEle.innerHTML = '<div style="color:red">' + errorMessage + '</div>';
         // ...
     });
 }

 function SignOut() {
     firebase.auth().signOut().then(function () {
         // Sign-out successful.
         location.reload(true);
     }).catch(function (error) {
         // An error happened.
     });
 }

 //Tells if the loaded calendar is a students
 var isStudentCalendar = false;

 /**Gets the database reference for a student by first and last name */
 async function getStuRefByName(first, last) {
     var toReturn = false;
     //Go through the database once
     userRef.once('value', snap => {
         //Iterates through all auto-generated references
         snap.forEach(stuRef => {
             var stuToCheck = stuRef.val();
             //Check for name equality
             let dataFirst = stuToCheck.firstName.replace(" ", "").toLowerCase();
             let dataLast = stuToCheck.lastName.replace(' ', "").toLowerCase();
             first = first.toLowerCase();
             last = last.toLowerCase();
             if (dataFirst === first && dataLast === last) {
                 toReturn = stuToCheck.ref
             }
         })
     });
     //Returns false if it found the student or the string of the database ref otherwise
     return toReturn;
 }

 async function loadStudentCalendar(stuRef, month, year) {
     isStudentCalendar = true;
     if (!stuRef.startsWith('users/')) {
         stuRef = 'users/' + stuRef;
     }
     calendarStudent = stuRef;

     openLoadTab();
     await loadAllCalendar(month, year);
     openTab2();

     //Do some tweaks to the calendar to stop data editing
     document.getElementsByClassName('sideBar')[0].classList.add('hidden');
     document.getElementsByClassName("leftArrow1")[0].style.display = 'none';
     document.getElementsByClassName("rightArrow1")[0].style.display = 'none';
     //Of elements with inputs,
     Array.from(document.getElementsByClassName('noStudent ')).forEach(element => {
         element.classList.add('hidden');
     });
     Array.from(document.getElementsByClassName('studentOutput')).forEach(element => {
         element.classList.add('stuDisplay');
     });

     Array.from(document.getElementsByClassName('onlyStudent')).forEach(element => {
         element.classList.remove('hidden');
     });

 }

 /**Shortcut for loading by name utilizing other functions */
 async function loadStudentCalendarByName(first, last, month, year) {
     var stuRef = await getStuRefByName(first, last);
     let errEle = document.getElementById('loginError');
     //Make sure that the student was found
     if (stuRef) {
         errEle.innerHTML = '';
         document.getElementById('logIn').style.display = 'none';
         loadStudentCalendar(stuRef, month, year);
     } else {
         //This means there is no students with that name. Change this to whatever
         errEle.innerHTML = '<div style="color:red">ACCESS NOT GRANTED</div>'
     }
 }

 function goBack() {
     if (isStudentCalendar) {
         SignOut()
     } else {
         openTab1();
         document.getElementById("extraMenu").classList.add('hidden');
         document.getElementById("inputMenu").classList.add('hidden');
         correction = false;
         updateAll()
     }
 }