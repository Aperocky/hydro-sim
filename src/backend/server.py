from flask import Flask
from flask import request, jsonify
from util import meshgrid_combine


app = Flask(__name__)
GOOD = {"success": True}
FAIL = {"success": False}


def fail_with_reason(reason):
    failure = FAIL.copy()
    failure.update({"reason": reason})
    return failure


@app.route("/matrix", methods=["GET"])
def get_combine_mesh():
    size = request.args.get("size", "100")
    reps = request.args.get("reps", "100")
    min_feature_size = request.args.get("min_feature", "0.1")
    baseline = request.args.get("baseline", "0")
    try:
        size = int(size)
        reps = int(reps)
        min_feature_size = float(min_feature_size)
        baseline = int(baseline)
    except ValueError:
        return jsonify(fail_with_reason("argument must be integers"))
    if baseline not in [0,1,2]:
        return jsonify(fail_with_reason("Baseline value not accepted"))

    matrix = meshgrid_combine(size, reps, min_feature_size, baseline)
    maxi = matrix.max()
    mini = matrix.min()
    mean = matrix.mean()
    jsonified_matrix = matrix.tolist()
    result = {
        "matrix": jsonified_matrix,
        "max": maxi,
        "min": mini,
        "mean": mean,
    }
    result.update(GOOD)
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5002)

