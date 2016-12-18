$(function () {
    $(".quiz-joining").on("submit", function (e) {
        if (e.preventDefault) e.preventDefault();

        $(".error-message").removeClass("show");

        $.ajax({
            type: "POST",
            url: "api/v1/join",
            contentType: "application/json",
            processData: false,
            data: {
                "quiz_code": $(".quiz-code").val(),
                "name": $(".contestant-name").val()
            },
            success: function (res, status, xhr) {
                if (res.contestant_sid) {
                    createCookie("webdrawquiz.contestant_sid", res.contestant_sid);
                    location.replace("play/");
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
    });
});
