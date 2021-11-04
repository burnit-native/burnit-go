import React, { Component } from 'react'
import { SceneMap, TabBar, TabView } from 'react-native-tab-view'
import LoginContainer from '../../components/Login'
import TaskList from '../Tasks/TaskList'
import Template from '../Template/Template'
import QuicklyList from '../QuicklyList/MainCategoriesList'
import AsyncStorage from '@react-native-async-storage/async-storage'

import * as actions from '../../store/actions'
import { connect } from 'react-redux'

class Main extends Component {
	state = {
		tabs: {
			index: 0,
			routes: [
				{ key: 'lists', title: this.props.translations.MainCategoriesList },
				{ key: 'tasks', title: this.props.translations.tasks },
			],
		},
		loading: true,
		isLoggedIn: AsyncStorage.getItem('isLoggedIn') === 'yes' ? true : false,
	}

	componentDidMount() {
		this.props.onInitTheme()
		this.props.onInitCategories()
		this.props.onInitProfile()
		this.props.onInitLists()
		this.props.onInitSettings(() => {
			this.setState({ loading: false })
		})
	}

	componentDidUpdate(prevProps) {
		if (this.state.isLoggedIn) {
			this.props.onInitToDo()
		}
		if (prevProps.translations !== this.props.translations) {
			const { tabs } = this.state
			const { translations } = this.props

			tabs.routes[0].title = translations.tasks
			tabs.routes[1].title = translations.MainCategoriesList
			this.setState({ tabs })
		}
	}

	render() {
		const { tabs, loading } = this.state
		const { navigation, theme, hideTabView, onInitCategories } = this.props

		return (
			<>
				{!this.state.isLoggedIn ? (
					<LoginContainer
						navigation={navigation}
						onLoginSuccess={() => this.setState({ isLoggedIn: true })}
					/>
				) : (
					<Template bgColor={theme.secondaryBackgroundColor}>
						<TabView
							navigationState={tabs}
							tabStyle={{ backgroundColor: theme.primaryColor }}
							onIndexChange={(index) => {
								tabs.index = index
								this.setState({ tabs })
							}}
							renderScene={SceneMap({
								lists: () => <QuicklyList navigation={navigation} onInitCategories={onInitCategories} />,
								tasks: () => <TaskList navigation={navigation} />,
							})}
							renderTabBar={(props) => (
								<TabBar
									{...props}
									onTabPress={({ route }) => {
										props.jumpTo(route.key)
									}}
									indicatorStyle={{ backgroundColor: theme.primaryTextColor }}
									style={{
										backgroundColor: theme.primaryColor,
										height: hideTabView ? 0 : 50,
									}}
								/>
							)}
						/>
					</Template>
				)}
			</>
		)
	}
}

const mapStateToProps = (state) => ({
	theme: state.theme.theme,
	lang: state.settings.settings.lang,
	hideTabView: state.settings.settings.hideTabView,
	translations: state.settings.translations.Main,
})

const mapDispatchToProps = (dispatch) => ({
	onInitToDo: () => dispatch(actions.initToDo()),
	onInitLists: () => dispatch(actions.initLists()),
	onInitCategories: () => dispatch(actions.initCategories()),
	onInitTheme: () => dispatch(actions.initTheme()),
	onInitProfile: () => dispatch(actions.initProfile()),
	onInitSettings: (callback) => dispatch(actions.initSettings(callback)),
})

export default connect(mapStateToProps, mapDispatchToProps)(Main)
