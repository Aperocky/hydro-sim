## Hydro-Sim

I used to spend countless day at the beach (especially those with water coming from wetsand up) digging channels and pits and dams, and then draining them. Water flowing across sand quickly creates features on a much shorter scale than nature at a great pace. A delta of sand can form in as soon as a minute, and these features are facinating.

I haven't been able to spend much time on the beach with flowing water, but what I do have is a computer. And I'm going to write a simulator that will grow those features, change climate and carry virtual sediments in a browser. So I can have (MY KIND OF) beach experience at my laptop.

## Design.

*Server*:

A python package to return a randomly generated terrain by multi-variate normal distributions, precipitation is also generated from the same package. The eventual goal is to put it on Lambda. It's just way too difficult to find the appropriate scientific computing package and functions for javascript, so it make sense to have a small self contained backend service.

*Main*:

Main package is written in typescript - with eventual goal of placing the terrain in pixi containers, with turn by turn erosion/sedimentation. Might add in climate change for fun.

## Progress

:white_check_mark: *Terrain Providing Flask(local) Backend.*

:white_check_mark: *Sim reading from the local Backend*

:white_check_mark: *Sim creating appropriately*

:white_check_mark: *Basic structure of component/sim thought out*

:white_check_mark: *Sim populating the flow directions*

:white_check_mark: *Sim populating the basins*

:white_check_mark: *Visualization: Display Altitude map*

![Altitude Map](/images/alt_map.png)

:white_check_mark: *Visualization: Display precipitation, basins and watershed*

![Precipitation Map](/images/precip_map.png)

![Basin Map](/images/basin_map.png)

:white_check_mark: *build static flow volume chart with first turn fill up*

:black_square_button: *build logic to process overflowe events and superbasin creation*

:black_square_button: *build actual flow volume, and lake fill up turn based action*

:black_square_button: *build basin overflow, merge actions*

:black_square_button: *Visualization: Display rivers and lakes*

:black_square_button: *Clickable display of variables within browser page*

:black_square_button: *Add sedimentation and erosion*

:black_square_button: *Climate change on whims*

:white_check_mark: *Park a domain*

:black_square_button: *Hook that domain to route53*

:black_square_button: *Build stack with lambda and apig*

:black_square_button: *Migrate frontend stack from local to S3*

:black_square_button: *Bask in glory*
