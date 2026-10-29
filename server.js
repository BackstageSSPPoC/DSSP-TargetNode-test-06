const http = require("http");
// const express = require("express");

const PORT = process.env.PORT || 3000;
const URL_PREFIX = process.env.URL_PREFIX || "";

const server = http.createServer((req, res) => {

  // Strip the prefix before route matching
  let path = req.url;
  if (URL_PREFIX && path.startsWith(URL_PREFIX)) {
    path = path.slice(URL_PREFIX.length) || "/";
  } else if (URL_PREFIX) {
    // Request doesn't match expected prefix
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 - Page Not Found");
    return;
  }

  // Health check endpoint for Docker/Kubernetes
  if (path === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "UP",
        application: "DSSP Portal",
      })
    );
    return;
  }

  // Main application page
  if (path === "/" || path === "") {
    const deployedAt = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
    });

    res.end(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <title>DSSP Task Tracker</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            min-height: 100vh;
            background: #f4f4f4;
            font-family: Arial, Helvetica, sans-serif;
            display: flex;
            flex-direction: column;
          }

          .content {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding-top: 48px;
          }

          .card {
            width: 640px;
            max-width: calc(100% - 40px);
            background: #ffffff;
            border-radius: 10px;
            padding: 40px 35px 35px;
            box-shadow: 0 3px 12px rgba(0, 0, 0, 0.15);
          }

          .card h2 {
            margin: 0 0 20px;
            color: #24466b;
            font-size: 32px;
            line-height: 1.15;
            font-weight: 700;
            text-align: center;
          }

          .success {
            color: #00b050;
            font-size: 18px;
            margin-bottom: 24px;
            text-align: center;
          }

          form {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 16px;
          }

          input[type=text] {
            flex: 1 1 220px;
            padding: 10px;
            border: 1px solid #cccccc;
            border-radius: 6px;
            font-size: 15px;
          }

          select,
          button {
            padding: 9px 12px;
            border-radius: 6px;
            border: 1px solid #cccccc;
            background: #ffffff;
            font-size: 14px;
            cursor: pointer;
          }

          button.primary {
            background: #0000ee;
            border-color: #0000ee;
            color: #ffffff;
          }

          .stats {
            color: #555555;
            font-size: 14px;
            margin-bottom: 12px;
          }

          .filters {
            display: flex;
            gap: 6px;
            margin-bottom: 8px;
          }

          .filters button.active {
            background: #24466b;
            border-color: #24466b;
            color: #ffffff;
          }

          ul {
            list-style: none;
            margin: 0;
            padding: 0;
          }

          li {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 0;
            border-bottom: 1px solid #eeeeee;
          }

          li .title {
            flex: 1;
            color: #24466b;
          }

          li.done .title {
            text-decoration: line-through;
            color: #999999;
          }

          li.empty {
            justify-content: center;
            color: #999999;
          }

          .badge {
            font-size: 12px;
            padding: 2px 8px;
            border-radius: 10px;
            color: #ffffff;
          }

          .low {
            background: #00b050;
          }

          .medium {
            background: #e0a000;
          }

          .high {
            background: #d32f2f;
          }

          .deployment {
            color: #777777;
            font-size: 14px;
            text-align: center;
            margin-top: 24px;
          }
        </style>
      </head>

      <body>

        <main class="content">
          <div class="card">

            <h2>DSSP Task Tracker</h2>

            <div class="success">
              NodeJS Pipeline Test Successful
            </div>

            <form id="addForm">
              <input type="text" id="title" placeholder="New task..." maxlength="120" required>
              <select id="priority">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
              </select>
              <button class="primary" type="submit">Add</button>
            </form>

            <div class="stats" id="stats"></div>

            <div class="filters" id="filters">
              <button type="button" data-filter="all" class="active">all</button>
              <button type="button" data-filter="todo">todo</button>
              <button type="button" data-filter="in-progress">in-progress</button>
              <button type="button" data-filter="done">done</button>
            </div>

            <ul id="list"></ul>

            <div class="deployment">
              Deployed at: ${deployedAt} IST
            </div>

          </div>
        </main>

        <script>
          var KEY = "dssp-tasks";
          var tasks = [];
          var filter = "all";
          var seq = 0;

          function load() {
            try {
              tasks = JSON.parse(localStorage.getItem(KEY)) || [];
            } catch (e) {
              tasks = [];
            }
          }

          function save() {
            try {
              localStorage.setItem(KEY, JSON.stringify(tasks));
            } catch (e) {
              /* storage not available */
            }
          }

          function makeRow(t) {
            var li = document.createElement("li");
            if (t.status === "done") li.className = "done";

            var title = document.createElement("span");
            title.className = "title";
            title.textContent = t.title;

            var badge = document.createElement("span");
            badge.className = "badge " + t.priority;
            badge.textContent = t.priority;

            var sel = document.createElement("select");
            ["todo", "in-progress", "done"].forEach(function (s) {
              var o = document.createElement("option");
              o.value = s;
              o.textContent = s;
              o.selected = s === t.status;
              sel.appendChild(o);
            });
            sel.onchange = function () {
              t.status = sel.value;
              save();
              render();
            };

            var del = document.createElement("button");
            del.type = "button";
            del.textContent = "Delete";
            del.onclick = function () {
              tasks = tasks.filter(function (x) { return x.id !== t.id; });
              save();
              render();
            };

            [title, badge, sel, del].forEach(function (el) { li.appendChild(el); });
            return li;
          }

          function render() {
            var counts = { "todo": 0, "in-progress": 0, "done": 0 };
            tasks.forEach(function (t) { counts[t.status]++; });
            document.getElementById("stats").textContent =
              "Total " + tasks.length + " | To do " + counts["todo"] +
              " | In progress " + counts["in-progress"] + " | Done " + counts["done"];

            var buttons = document.querySelectorAll("#filters button");
            for (var i = 0; i < buttons.length; i++) {
              var on = buttons[i].getAttribute("data-filter") === filter;
              buttons[i].className = on ? "active" : "";
            }

            var list = document.getElementById("list");
            list.innerHTML = "";
            var shown = tasks.filter(function (t) { return filter === "all" || t.status === filter; });
            if (!shown.length) {
              list.innerHTML = '<li class="empty">No tasks</li>';
              return;
            }
            shown.forEach(function (t) { list.appendChild(makeRow(t)); });
          }

          document.getElementById("addForm").onsubmit = function (e) {
            e.preventDefault();
            var input = document.getElementById("title");
            var text = input.value.trim();
            if (!text) return;
            tasks.push({
              id: Date.now() + "-" + (seq++),
              title: text,
              priority: document.getElementById("priority").value,
              status: "todo"
            });
            input.value = "";
            save();
            render();
          };

          var filterButtons = document.querySelectorAll("#filters button");
          for (var k = 0; k < filterButtons.length; k++) {
            filterButtons[k].onclick = function () {
              filter = this.getAttribute("data-filter");
              render();
            };
          }

          load();
          render();
        </script>

      </body>
      </html>
    `);

    return;
  }

  // 404 for unknown routes
  res.writeHead(404, {
    "Content-Type": "text/plain",
  });

  res.end("404 - Page Not Found");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`DSSP application running on port ${PORT}, prefix: ${URL_PREFIX || "(none)"}`);
});
