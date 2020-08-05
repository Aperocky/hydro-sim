import os, sys
from matplotlib import pyplot as plt
from util import meshgrid_combine, meshgrid_spikes


if __name__ == '__main__':
    size = int(sys.argv[1])
    reps = int(sys.argv[2])
    min_feature = 0.1
    if len(sys.argv) > 3:
        min_feature = float(sys.argv[3])
    result = meshgrid_combine(size, reps, min_feature, 0)
    plt.imshow(result)
    plt.show()

