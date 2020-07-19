import os, sys
from matplotlib import pyplot as plt
from util import meshgrid_combine


if __name__ == '__main__':
    size = int(sys.argv[1])
    reps = int(sys.argv[2])
    min_feature = 0.1
    if len(sys.argv) > 3:
        min_feature = float(sys.argv[3])
    result = meshgrid_combine(size, reps, 0, min_feature)
    plt.imshow(result)
    plt.show()
