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
    adjust = request.args.get("adjust", "1")
    try:
        size = int(size)
        reps = int(reps)
        adjust = int(adjust)
    except ValueError:
        return jsonify(fail_with_reason("argument must be integers"))

    matrix = meshgrid_combine(size, reps, adjust)
    jsonified_matrix = matrix.tolist()
    result = {"matrix": jsonified_matrix}
    result.update(GOOD)
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5002)

