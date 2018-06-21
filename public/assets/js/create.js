$(function () {
    function bindRow(row) {
        $(row).find(".remove-question").click(function () {
            if ($(this).parents("tbody").find("tr").length < 2)
                return;

            $(this).parents("tr").remove();
        });
    }
    $(".add-question").click(function (e) {
        if (e.preventDefault) e.preventDefault();

        var tbody = $(".quiz-questions tbody")[0];
        var row = $(".quiz-questions tbody tr.template.freeform-row")[0];
        row = row.cloneNode(true);
        $(row).removeClass("template");
        tbody.appendChild(row);
        bindRow(row);
    });
    $(".add-choice-question").click(function (e) {
        if (e.preventDefault) e.preventDefault();

        var tbody = $(".quiz-questions tbody")[0];
        var row = $(".quiz-questions tbody tr.template.choice-row")[0];
        row = row.cloneNode(true);
        $(row).removeClass("template");
        tbody.appendChild(row);
        bindRow(row);
    });

    bindRow($(".quiz-questions tbody tr:not(.template)"));

    $(".quiz-creation").on("submit", function (e) {
        if (e.preventDefault) e.preventDefault();

        $(".error-message").removeClass("show");

        var time_limit = $(".quiz-time-limit").val();

        $.ajax({
            type: "POST",
            url: "api/v1/create",
            contentType: "application/json",
            processData: false,
            data: {
                "title": $(".quiz-title").val(),
                "questions": $(".quiz-questions tbody tr:not(.template)").map(function (i, e) {
                    var spec = {
                        "question": $(e).find(".quiz-question").val(),
                        "answer": $(e).find(".quiz-answer").val(),
                        "time_limit": time_limit,
                        "score": $(e).find(".quiz-score").val()
                    };
                    if ($(e).hasClass("choice-row"))
                        spec["valid_responses"] = $(e).find(".quiz-valid-responses").val();

                    return spec;
                }).toArray()
            },
            success: function (res, status, xhr) {
                if (res.host_sid) {
                    createCookie("webdrawquiz.host_sid", res.host_sid);
                    createCookie("webdrawquiz.quiz_code", res.quiz_code);
                    location.replace("admin/");
                } else {
                    $(".error-message").addClass("show")
                        .html("Got unexpected response from server.");
                }
            },
            error: function (xhr, status, error) {
                try {
                    var obj = JSON.parse(xhr.responseText);
                    if (obj.error_description)
                        $(".error-message").addClass("show")
                            .html(obj.error_description);
                    else
                        $(".error-message").addClass("show")
                            .html("Error: " + obj.error_type);
                } catch (e) {
                    $(".error-message").addClass("show")
                        .html(error);
                }
            }
        });

        return false;
    });
});
