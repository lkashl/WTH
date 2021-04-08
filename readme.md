# WTH: Whats Technically Happening

### A NodeJS resource monitoring utility in the terminal

## Important note
#### THIS UTILITY IS EXTREMELY EARLY ON IN DEVLOPMENT AND SHOULD ONLY BE USED FOR PLAY UNTIL A PROPER RELEASE IS ISSUED

#### DO NOT USE IN A PRODUCTION ENVIRONMENT, SERIOUSLY!!

## Description

A NodeJS based modular approach to system stats for those that prefer writing in Node. The goal is to keep components modularised enough that multiple interfaces and data streams can be contributed to this repo

## Getting started

Assuming you have NodeJS and NPM installed, clone this repo and then install all dependencies before using npm start. Heres a quick copy pasta:

```
git clone repo_name
cd repo_name
npm install --save
npm start
```

Please note: So far I've only tested this on Ubuntu. The data sources that underly the current modules are fairly standard across kernels so should interop across distros, however as there are no automated tests written (yet) your mileage will likely vary

## Contributing

I'm more than happy to take pull requests, however for now give me a couple of days to finalise some of the framework level considerations in case breaking changes are introduced that require major rework. Feel free to vote on features in the mean time

## Repo structure

### Layouts 

Defines the dashboard layout for the application with all UI concerns expressed here. Annotations are specified in the default file, but a couple of high level notes: 

- Access is programmatic using .js rather than .json to allow for conditional UI behaviours without a templating engine. Also comments, yay
- The layout files pass through information to the stat files regarding limits in their structuring, ie. amount of devices needed, sorting preference as well as high level data preference where applicable (ie. time series vs table)

### Stats 

Stat files provide the underlying statistics for devices. All stat files should use the GenericTask class for now which is just a wrapper script for executing the following phases:

- Init: First initialisation of the statistic collector. Execute once off tasks here like opening a file descriptor or forming your data types
- PrepareRender: Prepares the structual components necessary for a render. This is called either on the first render cycle or when the GenericTasks internal _forceRender parameter is toggled to true within the statistic collector
- Collect: Perform whatever actions are necessary for preparing your data into a format that can be interpreted. Ideally the data format is suitably structured for the render at this point for optimal efficiency. This is called every *interval*
- Render: This performs the render of the data in the statistic script and occurs every *interval*


*Note: You should not set any of the "_" parameters in the GenericTask unless you want to communicate back to the wrapper script. For purposes internal to your statistic collector just use non _ delineated parameters*

### Config

File for user customisation. There are limited behaviors supported at the moment since many of them have been migrated to UI concerns. At the moment:

- Intervals: The amount of interval data to store. This will likely be migrated to the layouts folder since the UI will designate usable area for components. The scroll of the graph is also defined by the UI component based on the grid layout by the looks of things
- Interval: The frequency with which to poll. This will likely be driven within the terminal application so that users can toggle on the fly rather than being bound by a static interval

### TODO:

- Add NVIDIA DGPU support
- Add Intel IGPU support
- Add error logging for system
- Add dynamically scaling graph (at the moment scales one way)
- Remove unnecessary async awaits 