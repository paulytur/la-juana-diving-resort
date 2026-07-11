(function () {
  var script = document.currentScript;
  if (!script) return;

  var base = (script.getAttribute("data-base") || "https://la-juana-resort.vercel.app").replace(
    /\/$/,
    "",
  );
  var partner = script.getAttribute("data-partner") || "";
  var mode = script.getAttribute("data-mode") || "embed";
  var height = script.getAttribute("data-height") || "760";
  var checkIn = script.getAttribute("data-check-in") || "";
  var checkOut = script.getAttribute("data-check-out") || "";
  var guests = script.getAttribute("data-guests") || "";
  var room = script.getAttribute("data-room") || "";
  var label = script.getAttribute("data-label") || "Book with La Juana";

  var params = new URLSearchParams();
  if (partner) params.set("partner", partner);
  if (checkIn) params.set("checkIn", checkIn);
  if (checkOut) params.set("checkOut", checkOut);
  if (guests) params.set("guests", guests);
  if (room) params.set("room", room);

  var url = base + "/embed/book" + (params.toString() ? "?" + params.toString() : "");
  var mount = script.parentNode;
  if (!mount) return;

  if (mode === "button") {
    var link = document.createElement("a");
    link.href = base + "/book" + (params.toString() ? "?" + params.toString() : "");
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label;
    link.style.display = "inline-flex";
    link.style.alignItems = "center";
    link.style.justifyContent = "center";
    link.style.padding = "12px 20px";
    link.style.borderRadius = "9999px";
    link.style.background = "#1a42c4";
    link.style.color = "#ffffff";
    link.style.fontWeight = "700";
    link.style.fontSize = "14px";
    link.style.textDecoration = "none";
    link.style.fontFamily =
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    mount.insertBefore(link, script.nextSibling);
    return;
  }

  var iframe = document.createElement("iframe");
  iframe.src = url;
  iframe.title = "Book with La Juana Diving Resort";
  iframe.loading = "lazy";
  iframe.style.width = "100%";
  iframe.style.border = "0";
  iframe.style.minHeight = height + "px";
  iframe.style.borderRadius = "16px";
  iframe.style.background = "#ffffff";
  mount.insertBefore(iframe, script.nextSibling);
})();
